package com.livechat;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.livechat.dto.*;
import com.livechat.model.*;
import com.livechat.service.*;
import com.livechat.util.BcryptUtil;
import com.livechat.util.ConfigUtil;
import com.livechat.util.FileUtil;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelProgressiveFuture;
import io.netty.channel.ChannelProgressiveFutureListener;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpChunkedInput;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaderValues;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpRequestDecoder;
import io.netty.handler.codec.http.HttpResponseEncoder;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpUtil;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.handler.codec.http.LastHttpContent;
import io.netty.handler.stream.ChunkedFile;
import io.netty.handler.stream.ChunkedWriteHandler;
import io.netty.util.CharsetUtil;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang3.StringUtils;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.URLDecoder;
import java.sql.Timestamp;
import java.util.*;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

public class Main {
    private static final Map<UUID, SocketIOClient> clientsMap = new HashMap<>();
    private static final Map<UUID, Account> clientAccounts = new HashMap<>();
    private static final Set<Integer> onlineUsersSet = new HashSet<>();
    private static final Map<String, SessionEntry> sessions = new HashMap<>(); // SessionID -> SessionEntry
    private static class SessionEntry {
        Account account;
        long expireTime;

        SessionEntry(Account account, long expireTime) {
            this.account = account;
            this.expireTime = expireTime;
        }
    }
    private static AccountService accountService = new AccountService();
    private static TicketService ticketService = new TicketService();
    private static RoomService roomService = new RoomService();
    private static MessageService messageService = new MessageService();
    private static NotificationService notificationService = new NotificationService();
    private static FileService fileService = new FileService();
    private static String FILE_FOLDER;
    private static final long SESSION_EXPIRE_MS = 3600 * 1000; // 1 hour

    public static void main(String[] args) {
        Properties props = ConfigUtil.loadConfig();
        DatabaseManager.init(props);
        BcryptUtil.init(props.getProperty("bcrypt.salt"));
        FileUtil.init(props.getProperty("file.folder"));
        FILE_FOLDER = props.getProperty("file.folder");
        new File(FILE_FOLDER).mkdirs();

        // Session expire scheduler
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(() -> {
            long now = System.currentTimeMillis();
            sessions.entrySet().removeIf(entry -> entry.getValue().expireTime < now);
        }, 0, 5, TimeUnit.MINUTES);

        Configuration config = new Configuration();
        config.setHostname(props.getProperty("socket.host"));
        config.setPort(Integer.parseInt(props.getProperty("socket.port")));
        SocketIOServer server = new SocketIOServer(config);

        server.addConnectListener(new ConnectListener() {
            @Override
            public void onConnect(SocketIOClient client) {
                System.out.println("Client connected: " + client.getSessionId());
            }
        });

        server.addDisconnectListener(new DisconnectListener() {
            @Override
            public void onDisconnect(SocketIOClient client) {
                UUID sessionId = client.getSessionId();
                Account account = clientAccounts.remove(sessionId);
                clientsMap.remove(sessionId);
                if (account != null) {
                    onlineUsersSet.remove(account.getAccountID());
                }
                System.out.println("Client disconnected: " + (account != null ? account.getAccountName() : "unknown"));
            }
        });

        server.addEventListener("auth", String.class, (client, sessionId, ack) -> {
            SessionEntry entry = sessions.get(sessionId);
            long now = System.currentTimeMillis();
            if (entry != null && entry.expireTime > now) {
                clientAccounts.put(client.getSessionId(), entry.account);
                clientsMap.put(client.getSessionId(), client);
                onlineUsersSet.add(entry.account.getAccountID());
                client.sendEvent("authSuccess", entry.account, sessionId);
            } else {
                client.sendEvent("authError", "Invalid or expired session");
                if (entry != null) {
                    sessions.remove(sessionId);
                }
            }
        });

        server.addEventListener("register", RegisterRequest.class, (client, data, ack) -> {
            if (StringUtils.isBlank(data.getEmail()) || StringUtils.isBlank(data.getPassword()) || StringUtils.isBlank(data.getAccountName())) {
                client.sendEvent("registerError", "Missing fields");
                return;
            }
            Account account = new Account();
            account.setEmail(data.getEmail());
            account.setPassword(data.getPassword());
            account.setAccountName(data.getAccountName());
            Account registered = accountService.register(account);
            if (registered != null) {
                client.sendEvent("registerSuccess", registered);
            } else {
                client.sendEvent("registerError", "Email already exists or error");
            }
        });

        server.addEventListener("login", LoginRequest.class, (client, data, ack) -> {
            if (StringUtils.isBlank(data.getEmail()) || StringUtils.isBlank(data.getPassword())) {
                client.sendEvent("loginError", "Missing fields");
                return;
            }
            Account account = accountService.login(data.getEmail(), data.getPassword());
            if (account != null) {
                String sessionId = UUID.randomUUID().toString();
                long expire = System.currentTimeMillis() + SESSION_EXPIRE_MS;
                sessions.put(sessionId, new SessionEntry(account, expire));
                clientAccounts.put(client.getSessionId(), account);
                clientsMap.put(client.getSessionId(), client);
                onlineUsersSet.add(account.getAccountID());
                client.sendEvent("loginSuccess", account, sessionId);
            } else {
                client.sendEvent("loginError", "Invalid credentials");
            }
        });

        server.addEventListener("logout", String.class, (client, sessionId, ack) -> {
            SessionEntry entry = sessions.remove(sessionId);
            if (entry != null) {
                onlineUsersSet.remove(entry.account.getAccountID());
                clientAccounts.remove(client.getSessionId());
                client.sendEvent("logoutSuccess");
            }
            client.disconnect();
        });

        server.addEventListener("createAccount", CreateAccountRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && current.getRoleID() == 2) { // Admin
                if (StringUtils.isBlank(data.getEmail()) || StringUtils.isBlank(data.getPassword()) || StringUtils.isBlank(data.getAccountName()) || data.getRoleID() == 0) {
                    client.sendEvent("createAccountError", "Missing fields");
                    return;
                }
                Account account = new Account();
                account.setEmail(data.getEmail());
                account.setPassword(data.getPassword());
                account.setAccountName(data.getAccountName());
                account.setRoleID(data.getRoleID());
                Account created = accountService.createAccount(account);
                if (created != null) {
                    client.sendEvent("createAccountSuccess", created);
                } else {
                    client.sendEvent("createAccountError", "Error creating account");
                }
            } else {
                client.sendEvent("createAccountError", "Unauthorized");
            }
        });

        server.addEventListener("getAllAccounts", String.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && current.getRoleID() == 2) {
                List<Account> accounts = accountService.getAllAccounts();
                client.sendEvent("allAccounts", accounts);
            } else {
                client.sendEvent("getAllAccountsError", "Unauthorized");
            }
        });

        server.addEventListener("getRoles", String.class, (client, data, ack) -> {
            List<Role> roles = accountService.getRoles();
            client.sendEvent("roles", roles);
        });

        server.addEventListener("getStaffByRole", GetStaffByRoleRequest.class, (client, data, ack) -> {
            List<Account> staff = accountService.getStaffByRole(data.getRoleID(), data.getSearchQuery());
            client.sendEvent("staffByRole", staff);
        });

        server.addEventListener("createTicket", CreateTicketRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && current.getRoleID() == 1) {
                if (data.getRoleID() == 0) {
                    client.sendEvent("createTicketError", "Invalid role");
                    return;
                }
                Ticket ticket = new Ticket();
                ticket.setTicketDescription(data.getDescription());
                ticket.setCustomerID(current.getAccountID());
                ticket.setRoleID(data.getRoleID());
                ticket.setStaffID(data.getStaffID());
                Ticket created = ticketService.createTicket(ticket);
                if (created != null) {
                    Notification noti = new Notification();
                    noti.setNotificationDescription("Ticket #" + created.getTicketID()+ " từ " + current.getAccountName() + " đang chờ xác nhận");
                    noti.setSendNotificationID(current.getAccountID());
                    if (data.getStaffID() != null) {
                        noti.setReceiveNotificationID(data.getStaffID());
                    } else {
                        noti.setRoleReceive(data.getRoleID());
                    }
                    notificationService.createNotification(noti);
                    broadcastNotification(server, noti);
                    client.sendEvent("createTicketSuccess", created);
                } else {
                    client.sendEvent("createTicketError", "Error creating ticket");
                }
            } else {
                client.sendEvent("createTicketError", "Unauthorized");
            }
        });

        server.addEventListener("getMyTickets", GetTicketsRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                List<Ticket> tickets = ticketService.getMyTickets(current.getAccountID(), current.getRoleID(), data.getFilterStatus(), data.getSearch(), data.getSort(), data.getPage(), data.getLimit());
                client.sendEvent("myTickets", tickets);
            } else {
                client.sendEvent("getMyTicketsError", "Unauthorized");
            }
        });

        server.addEventListener("getMyTicketsCount", GetTicketsRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                int count = ticketService.getTicketCount(current.getAccountID(), current.getRoleID(), data.getFilterStatus(), data.getSearch());
                client.sendEvent("myTicketsCount", count);
            } else {
                client.sendEvent("getMyTicketsCountError", "Unauthorized");
            }
        });

        server.addEventListener("acceptTicket", AcceptTicketRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && (current.getRoleID() == 2 || current.getRoleID() == 3)) {
                boolean success = ticketService.acceptTicket(data.getTicketID(), current.getAccountID());
                if (success) {
                    Room room = roomService.createRoom(data.getTicketID());
                    if (room != null) {
                        Ticket ticket = ticketService.getTicketById(data.getTicketID());
                        ticket.setRoomID(room.getRoomID());
                        Notification noti = new Notification();
                        noti.setNotificationDescription("Ticket #" + ticket.getTicketID() + " của bạn đã được chấp nhận");
                        noti.setSendNotificationID(current.getAccountID());
                        noti.setReceiveNotificationID(ticket.getCustomerID());
                        notificationService.createNotification(noti);
                        sendToUser(server, ticket.getCustomerID(), "ticketAccepted", ticket);
                        client.sendEvent("acceptTicketSuccess", ticket);
                    } else {
                        client.sendEvent("acceptTicketError", "Error creating room");
                    }
                } else {
                    client.sendEvent("acceptTicketError", "Error accepting ticket or already accepted");
                }
            } else {
                client.sendEvent("acceptTicketError", "Unauthorized");
            }
        });

        server.addEventListener("rejectTicket", RejectTicketRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && (current.getRoleID() == 2 || current.getRoleID() == 3)) {
                boolean success = ticketService.rejectTicket(data.getTicketID());
                if (success) {
                    Ticket ticket = ticketService.getTicketById(data.getTicketID());
                    Notification noti = new Notification();
                    noti.setNotificationDescription("Ticket #" + ticket.getTicketID() + " đã bị từ chối");
                    noti.setSendNotificationID(current.getAccountID());
                    noti.setReceiveNotificationID(ticket.getCustomerID());
                    notificationService.createNotification(noti);
                    sendToUser(server, ticket.getCustomerID(), "ticketRejected", ticket);
                    client.sendEvent("rejectTicketSuccess", ticket);
                } else {
                    client.sendEvent("rejectTicketError", "Error rejecting ticket");
                }
            } else {
                client.sendEvent("rejectTicketError", "Unauthorized");
            }
        });

        server.addEventListener("getTransferStaff", GetTransferStaffRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && (current.getRoleID() == 2 || current.getRoleID() == 3)) {
                List<Account> staff = accountService.getTransferStaff(data.getSearchQuery(), current.getRoleID());
                client.sendEvent("transferStaff", staff);
            } else {
                client.sendEvent("getTransferStaffError", "Unauthorized");
            }
        });

        server.addEventListener("transferTicket", TransferTicketRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && (current.getRoleID() == 2 || current.getRoleID() == 3)) {
                boolean success = ticketService.transferTicket(data.getTicketID(), data.getNewStaffID());
                if (success) {
                    Ticket ticket = ticketService.getTicketById(data.getTicketID());
                    Notification noti = new Notification();
                    noti.setNotificationDescription("Ticket #" + ticket.getTicketID() + " được chuyển tiếp đến bạn");
                    noti.setSendNotificationID(current.getAccountID());
                    noti.setReceiveNotificationID(data.getNewStaffID());
                    notificationService.createNotification(noti);
                    sendToUser(server, data.getNewStaffID(), "ticketTransferred", ticket);
                    sendToUser(server, ticket.getCustomerID(), "ticketTransferred", ticket);
                    client.sendEvent("transferTicketSuccess", ticket);
                } else {
                    client.sendEvent("transferTicketError", "Error transferring ticket");
                }
            } else {
                client.sendEvent("transferTicketError", "Unauthorized");
            }
        });

        server.addEventListener("endTicket", EndTicketRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && current.getRoleID() == 1) {
                Ticket ticket = ticketService.getTicketById(data.getTicketID());
                if (ticket != null && ticket.getCustomerID() == current.getAccountID()) {
                    boolean success = ticketService.endTicket(data.getTicketID(), data.getRatingPoint(), data.getRatingDesc());
                    if (success) {
                        Notification noti = new Notification();
                        noti.setNotificationDescription("Ticket #" + ticket.getTicketID() + " đã hoàn thành");
                        noti.setSendNotificationID(current.getAccountID());
                        noti.setReceiveNotificationID(ticket.getStaffID());
                        notificationService.createNotification(noti);
                        sendToUser(server, ticket.getStaffID(), "ticketCompleted", ticket);
                        client.sendEvent("endTicketSuccess", ticket);
                    } else {
                        client.sendEvent("endTicketError", "Error ending ticket or invalid rating");
                    }
                } else {
                    client.sendEvent("endTicketError", "Unauthorized or ticket not found");
                }
            } else {
                client.sendEvent("endTicketError", "Unauthorized");
            }
        });

        server.addEventListener("joinRoom", JoinRoomRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                Room room = roomService.getRoomById(data.getRoomID());
                if (room != null) {
                    Ticket ticket = ticketService.getTicketById(room.getTicketID());
                    if (ticket != null && (ticket.getCustomerID() == current.getAccountID() || ticket.getStaffID() == current.getAccountID())) {
                        client.sendEvent("joinRoomSuccess");
                        return;
                    }
                }
                client.sendEvent("joinRoomError", "Unauthorized or room not found");
            } else {
                client.sendEvent("joinRoomError", "Unauthorized");
            }
        });

        server.addEventListener("sendMessage", SendMessageRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null && StringUtils.isNotBlank(data.getMessage())) {
                Room room = roomService.getRoomById(data.getRoomID());
                if (room != null) {
                    Ticket ticket = ticketService.getTicketById(room.getTicketID());
                    if (ticket.getTicketStatusID() == 4) {
                        client.sendEvent("sendMessageError", "Chat is completed");
                        return;
                    }
                    if (ticket != null && (ticket.getCustomerID() == current.getAccountID() || ticket.getStaffID() == current.getAccountID())) {
                        Message msg = new Message();
                        msg.setMessageTypeID(1);
                        msg.setMessageText(data.getMessage());
                        msg.setRoomID(data.getRoomID());
                        msg.setSenderID(current.getAccountID());
                        messageService.saveMessage(msg);
                        Timestamp now = new Timestamp(System.currentTimeMillis());
                        roomService.updateLastMessage(data.getRoomID(), data.getMessage().length() > 50 ? data.getMessage().substring(0, 50) + "..." : data.getMessage(), now);
                        int otherID = ticket.getCustomerID() == current.getAccountID() ? ticket.getStaffID() : ticket.getCustomerID();
                        sendToUser(server, otherID, "receiveMessage", msg);
                        return;
                    }
                }
                client.sendEvent("sendMessageError", "Unauthorized or room not found");
            } else {
                client.sendEvent("sendMessageError", "Unauthorized or empty message");
            }
        });

        server.addEventListener("sendFile", SendFileRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                Room room = roomService.getRoomById(data.getRoomID());
                if (room != null) {
                    Ticket ticket = ticketService.getTicketById(room.getTicketID());
                    if (ticket.getTicketStatusID() == 4) {
                        client.sendEvent("sendFileError", "Chat is completed");
                        return;
                    }
                    if (ticket != null && (ticket.getCustomerID() == current.getAccountID() || ticket.getStaffID() == current.getAccountID())) {
                        byte[] fileBytes = Base64.decodeBase64(data.getFileData());
                        try {
                            String filePath = FileUtil.saveFile(fileBytes, data.getFileName());
                            System.out.println("FilePath to save in DB and emit: " + filePath);
                            FileModel file = new FileModel();
                            file.setFilePath(filePath);
                            file.setFileName(data.getFileName());
                            file.setFileTypeID(fileService.getFileTypeIDByCode(FileUtil.getExtension(data.getFileName())));
                            file.setAccountID(current.getAccountID());
                            int fileID = fileService.saveFile(file);
                            if (fileID == -1) {
                                client.sendEvent("sendFileError", "Error saving file to DB");
                                return;
                            }
                            Message msg = new Message();
                            msg.setMessageTypeID(2);
                            msg.setMessageText(data.getMessage());
                            msg.setRoomID(data.getRoomID());
                            msg.setSenderID(current.getAccountID());
                            msg.setFileID(fileID);
                            msg.setFilePath(filePath);
                            msg.setFileName(data.getFileName());
                            messageService.saveMessage(msg);
                            Timestamp now = new Timestamp(System.currentTimeMillis());
                            roomService.updateLastMessage(data.getRoomID(), "File: " + data.getFileName(), now);
                            int otherID = ticket.getCustomerID() == current.getAccountID() ? ticket.getStaffID() : ticket.getCustomerID();
                            sendToUser(server, otherID, "receiveMessage", msg);
                            return;
                        } catch (IOException e) {
                            e.printStackTrace();
                            client.sendEvent("sendFileError", "Error saving file");
                        }
                    }
                }
                client.sendEvent("sendFileError", "Unauthorized or room not found");
            } else {
                client.sendEvent("sendFileError", "Unauthorized");
            }
        });

        server.addEventListener("loadHistory", LoadHistoryRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                Room room = roomService.getRoomById(data.getRoomID());
                if (room != null) {
                    Ticket ticket = ticketService.getTicketById(room.getTicketID());
                    if (ticket != null && (ticket.getCustomerID() == current.getAccountID() || ticket.getStaffID() == current.getAccountID())) {
                        List<Message> history = messageService.loadHistory(data.getRoomID());
                        client.sendEvent("historyMessages", history);
                        return;
                    }
                }
                client.sendEvent("loadHistoryError", "Unauthorized or room not found");
            } else {
                client.sendEvent("loadHistoryError", "Unauthorized");
            }
        });

        server.addEventListener("getMyRooms", GetMyRoomsRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                List<Room> rooms = roomService.getMyRooms(current.getAccountID(), current.getRoleID(), data.getSearch(), data.getSort(), data.getPage(), data.getLimit());
                client.sendEvent("myRooms", rooms);
            } else {
                client.sendEvent("getMyRoomsError", "Unauthorized");
            }
        });

        server.addEventListener("getMyRoomsCount", GetMyRoomsRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                int count = roomService.getRoomsCount(current.getAccountID(), current.getRoleID(), data.getSearch());
                client.sendEvent("myRoomsCount", count);
            } else {
                client.sendEvent("getMyRoomsCountError", "Unauthorized");
            }
        });

        server.addEventListener("renameRoom", RenameRoomRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                Room room = roomService.getRoomById(data.getRoomID());
                if (room != null) {
                    Ticket ticket = ticketService.getTicketById(room.getTicketID());
                    if (ticket != null && (ticket.getCustomerID() == current.getAccountID() || ticket.getStaffID() == current.getAccountID())) {
                        boolean success = roomService.renameRoom(data.getRoomID(), data.getNewName());
                        if (success) {
                            client.sendEvent("renameRoomSuccess", data.getNewName());
                            int otherID = ticket.getCustomerID() == current.getAccountID() ? ticket.getStaffID() : ticket.getCustomerID();
                            sendToUser(server, otherID, "roomRenamed", data);
                            return;
                        }
                    }
                }
                client.sendEvent("renameRoomError", "Error renaming room or unauthorized");
            } else {
                client.sendEvent("renameRoomError", "Unauthorized");
            }
        });

        server.addEventListener("getMyNotifications", String.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                List<Notification> notis = notificationService.getMyNotifications(current.getAccountID(), current.getRoleID());
                client.sendEvent("myNotifications", notis);
            } else {
                client.sendEvent("getMyNotificationsError", "Unauthorized");
            }
        });
        server.addEventListener("getRoomById", JoinRoomRequest.class, (client, data, ack) -> {
            Account current = clientAccounts.get(client.getSessionId());
            if (current != null) {
                Room room = roomService.getRoomById(data.getRoomID());
                if (room != null) {
                    Ticket ticket = ticketService.getTicketById(room.getTicketID());
                    if (ticket != null &&
                        (ticket.getCustomerID() == current.getAccountID() ||
                         ticket.getStaffID() == current.getAccountID())) {
                        System.out.println("Emit roomInfo cho client: " + client.getSessionId() + " với room: " + room.getRoomID());
                        client.sendEvent("roomInfo", room);
                    } else {
                        client.sendEvent("getRoomError", "Unauthorized or room not found");
                    }
                } else {
                    client.sendEvent("getRoomError", "Room not found");
                }
            } else {
                client.sendEvent("getRoomError", "Unauthorized");
            }
        });
        
        server.addEventListener("clearAllNotifications", Map.class, (client, data, ackSender) -> {
            NotificationService notificationService = new NotificationService();
            int accountID = ((Number) data.get("accountID")).intValue();
            int roleID = ((Number) data.get("roleID")).intValue();
            notificationService.clearAllNotifications(accountID, roleID);
            client.sendEvent("notificationsCleared", true);  // Send confirmation to frontend
        });
        
        server.start();
        
        // File server (unchanged)
        NioEventLoopGroup bossGroup = new NioEventLoopGroup(1);
        NioEventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class)
             .childHandler(new ChannelInitializer<SocketChannel>() {
                 @Override
                 protected void initChannel(SocketChannel ch) {
                     ch.pipeline().addLast(new HttpRequestDecoder());
                     ch.pipeline().addLast(new HttpObjectAggregator(65536));
                     ch.pipeline().addLast(new HttpResponseEncoder());
                     ch.pipeline().addLast(new ChunkedWriteHandler());
                     ch.pipeline().addLast(new StaticFileHandler(FILE_FOLDER));
                 }
             });
            ChannelFuture f = b.bind(props.getProperty("socket.host"), Integer.parseInt(props.getProperty("file.server.port"))).sync();
            System.out.println("File server started on port " + props.getProperty("file.server.port"));
            f.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }

    private static void broadcastNotification(SocketIOServer server, Notification noti) {
        if (noti.getReceiveNotificationID() != null) {
            sendToUser(server, noti.getReceiveNotificationID(), "newNotification", noti);
        } else if (noti.getRoleReceive() != null) {
            for (Map.Entry<UUID, Account> entry : clientAccounts.entrySet()) {
                if (entry.getValue().getRoleID() == noti.getRoleReceive()) {
                    SocketIOClient receiver = clientsMap.get(entry.getKey());
                    if (receiver != null) {
                        receiver.sendEvent("newNotification", noti);
                    }
                }
            }
        }
    }

    private static void sendToUser(SocketIOServer server, Integer userID, String event, Object data) {
        if (userID == null) return;
        for (Map.Entry<UUID, Account> entry : clientAccounts.entrySet()) {
            if (entry.getValue().getAccountID() == userID) {
                SocketIOClient receiver = clientsMap.get(entry.getKey());
                if (receiver != null) {
                    receiver.sendEvent(event, data);
                }
            }
        }
    }

    // StaticFileHandler (unchanged, but updated path parsing for subfolder)
    public static class StaticFileHandler extends SimpleChannelInboundHandler<FullHttpRequest> {
        private static final Pattern INSECURE_URI = Pattern.compile(".*[<>&\"].*");
        private final String rootDir;

        public StaticFileHandler(String rootDir) {
            this.rootDir = rootDir;
        }

        @Override
        protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest request) throws Exception {
            if (request.method().equals(HttpMethod.OPTIONS)) {
        FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.NO_CONTENT);
        response.headers().set("Access-Control-Allow-Origin", "*");
        response.headers().set("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.headers().set("Access-Control-Allow-Headers", "Content-Type");
        response.headers().set("Access-Control-Max-Age", "3600");
        ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
        return;
    }
    String uri = request.uri();
    System.out.println("Requested URI: " + uri);
    if (!uri.startsWith("/files/")) {
        System.out.println("URI not starting with /files/: " + uri);
        sendError(ctx, HttpResponseStatus.NOT_FOUND);
        return;
    }
    String[] pathParts = uri.substring("/files/".length()).split("/");
    if (pathParts.length < 2) {
        System.out.println("Invalid path parts: " + Arrays.toString(pathParts));
        sendError(ctx, HttpResponseStatus.NOT_FOUND);
        return;
    }
    String ext = pathParts[0];
    String fileName = pathParts[1];
    String path = rootDir + File.separator + ext + File.separator + fileName;
    System.out.println("Computed file path: " + path);
    File file = new File(path);
    if (file.isHidden() || !file.exists() || !file.isFile()) {
        System.out.println("File invalid or not found: " + path);
        sendError(ctx, HttpResponseStatus.NOT_FOUND);
        return;
    }   
            RandomAccessFile raf;
            try {
                raf = new RandomAccessFile(file, "r");
            } catch (IOException ignore) {
                sendError(ctx, HttpResponseStatus.NOT_FOUND);
                return;
            }
            long fileLength = raf.length();
            FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.OK);
            HttpUtil.setContentLength(response, fileLength);
            setContentTypeHeader(response, file);
            response.headers().set("Access-Control-Allow-Origin", "*");
            response.headers().set("Access-Control-Allow-Methods", "GET, OPTIONS");
            response.headers().set("Access-Control-Allow-Headers", "Content-Type");
            if (HttpUtil.isKeepAlive(request)) {
                response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
            }
            ctx.write(response);
            ChannelFuture sendFileFuture = ctx.write(new HttpChunkedInput(new ChunkedFile(raf, 0, fileLength, 8192)), ctx.newProgressivePromise());
            sendFileFuture.addListener(new ChannelProgressiveFutureListener() {
                @Override
                public void operationProgressed(ChannelProgressiveFuture future, long progress, long total) {
                    if (total < 0) {
                        System.err.println(future.channel() + " Transfer progress: " + progress);
                    } else {
                        System.err.println(future.channel() + " Transfer progress: " + progress + " / " + total);
                    }
                }

                @Override
                public void operationComplete(ChannelProgressiveFuture future) {
                    System.err.println(future.channel() + " Transfer complete.");
                }
            });
            ChannelFuture lastContentFuture = ctx.writeAndFlush(LastHttpContent.EMPTY_LAST_CONTENT);
            if (!HttpUtil.isKeepAlive(request)) {
                lastContentFuture.addListener(ChannelFutureListener.CLOSE);
            }
        }

        private static void setContentTypeHeader(FullHttpResponse response, File file) {
            String mimeType = "application/octet-stream";
            try {
                mimeType = java.nio.file.Files.probeContentType(file.toPath());
            } catch (IOException e) {
                // Ignore
            }
            response.headers().set(HttpHeaderNames.CONTENT_TYPE, mimeType == null ? "application/octet-stream" : mimeType);
        }

        private static void sendError(ChannelHandlerContext ctx, HttpResponseStatus status) {
            FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status, Unpooled.copiedBuffer("Failure: " + status + "\r\n", CharsetUtil.UTF_8));
            response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");
            response.headers().set("Access-Control-Allow-Origin", "*");
            ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
        }

        @Override
        public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
            cause.printStackTrace();
            if (ctx.channel().isActive()) {
                sendError(ctx, HttpResponseStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
}
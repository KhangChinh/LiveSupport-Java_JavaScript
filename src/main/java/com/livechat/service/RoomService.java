package com.livechat.service;

import com.livechat.DatabaseManager;
import com.livechat.model.Room;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class RoomService {

    public Room createRoom(int ticketID) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "INSERT INTO Room (RoomName, TicketID) VALUES (?, ?)";
                PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                pstmt.setString(1, "Ticket #" + ticketID);
                pstmt.setInt(2, ticketID);
                pstmt.executeUpdate();
                ResultSet generatedKeys = pstmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    Room room = new Room();
                    room.setRoomID(generatedKeys.getInt(1));
                    room.setRoomName("Ticket #" + ticketID);
                    room.setTicketID(ticketID);
                    return room;
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return null;
    }

    public List<Room> getMyRooms(int accountID, int roleID, String search, String sort, int page, int limit) {
        List<Room> rooms = new ArrayList<>();
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "SELECT r.* FROM Room r JOIN Ticket t ON r.TicketID = t.TicketID WHERE " +
                        "(t.CustomerID = ? OR t.StaffID = ?) " +
                        (search != null ? " AND r.RoomName LIKE ?" : "") +
                        " ORDER BY " + (sort != null ? sort : "r.LastMessageTime DESC") +
                        " LIMIT ? OFFSET ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                int paramIndex = 1;
                pstmt.setInt(paramIndex++, accountID);
                pstmt.setInt(paramIndex++, accountID);
                if (search != null) {
                    pstmt.setString(paramIndex++, "%" + search + "%");
                }
                pstmt.setInt(paramIndex++, limit);
                pstmt.setInt(paramIndex, (page - 1) * limit);
                ResultSet rs = pstmt.executeQuery();
                while (rs.next()) {
                    Room room = new Room();
                    room.setRoomID(rs.getInt("RoomID"));
                    room.setRoomName(rs.getString("RoomName"));
                    room.setTicketID(rs.getInt("TicketID"));
                    room.setLastMessage(rs.getString("LastMessage"));
                    room.setLastMessageTime(rs.getTimestamp("LastMessageTime"));
                    rooms.add(room);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return rooms;
    }

    public int getRoomsCount(int accountID, int roleID, String search) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "SELECT COUNT(*) FROM Room r JOIN Ticket t ON r.TicketID = t.TicketID WHERE " +
                        "(t.CustomerID = ? OR t.StaffID = ?) " +
                        (search != null ? " AND r.RoomName LIKE ?" : "");
                PreparedStatement pstmt = conn.prepareStatement(sql);
                int paramIndex = 1;
                pstmt.setInt(paramIndex++, accountID);
                pstmt.setInt(paramIndex++, accountID);
                if (search != null) {
                    pstmt.setString(paramIndex++, "%" + search + "%");
                }
                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    return rs.getInt(1);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return 0;
    }

    public boolean renameRoom(int roomID, String newName) {
        if (newName == null || newName.isEmpty() || newName.length() > 30) {
            return false; // Validation
        }
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "UPDATE Room SET RoomName = ? WHERE RoomID = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setString(1, newName);
                pstmt.setInt(2, roomID);
                int rows = pstmt.executeUpdate();
                return rows > 0;
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return false;
    }

    public void updateLastMessage(int roomID, String lastMessage, Timestamp time) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "UPDATE Room SET LastMessage = ?, LastMessageTime = ? WHERE RoomID = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setString(1, lastMessage);
                pstmt.setTimestamp(2, time);
                pstmt.setInt(3, roomID);
                pstmt.executeUpdate();
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public Room getRoomByTicket(int ticketID) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "SELECT * FROM Room WHERE TicketID = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, ticketID);
                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    Room room = new Room();
                    room.setRoomID(rs.getInt("RoomID"));
                    room.setRoomName(rs.getString("RoomName"));
                    room.setTicketID(rs.getInt("TicketID"));
                    room.setLastMessage(rs.getString("LastMessage"));
                    room.setLastMessageTime(rs.getTimestamp("LastMessageTime"));
                    return room;
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return null;
    }

    public Room getRoomById(int roomID) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "SELECT * FROM Room WHERE RoomID = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, roomID);
                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    Room room = new Room();
                    room.setRoomID(rs.getInt("RoomID"));
                    room.setRoomName(rs.getString("RoomName"));
                    room.setTicketID(rs.getInt("TicketID"));
                    room.setLastMessage(rs.getString("LastMessage"));
                    room.setLastMessageTime(rs.getTimestamp("LastMessageTime"));
                    return room;
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return null;
    }
}
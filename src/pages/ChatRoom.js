// File: src/pages/ChatRoom.js
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import Linkify from "react-linkify";
import {
  joinRoom,
  sendMessage,
  sendFile,
  loadHistory,
} from "../services/MessageService";
import { getTransferStaff, transferTicket } from "../services/TicketService";
import { renameRoom, getRoomById } from "../services/RoomService";
import { endTicket } from "../services/TicketService";
import socket from "../services/SocketService";
import { useSnackbar } from "notistack";
import "./ChatRoom.scss";

const getExtension = (fileName) => {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.substring(dotIndex + 1).toLowerCase();
};

const ChatRoom = ({ onBack, showBackButton = false }) => {
  const { roomId } = useParams();
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingPoint, setRatingPoint] = useState(5);
  const [ratingDesc, setRatingDesc] = useState("");
  const [ticketID, setTicketID] = useState(null);

  useEffect(() => {
    getRoomById(
      { roomID: roomId },
      {
        success: (room) => {
          setRoomName(room.roomName);
          setTicketID(room.ticketID);
        },
        error: (msg) => {
          enqueueSnackbar(msg, { variant: "error" });
          navigate("/dashboard");
        },
      }
    );

    joinRoom(
      { roomID: roomId },
      {
        success: () => loadHistory({ roomID: roomId }, setMessages),
        error: (msg) => {
          enqueueSnackbar(msg, { variant: "error" });
          navigate("/dashboard");
        },
      }
    );

    socket.on("receiveMessage", (msg) => {
      console.log("Received message", msg);
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("roomRenamed", (data) => setRoomName(data.newName));
    socket.on("ticketTransferred", () => {
      enqueueSnackbar("Ticket transferred, access lost", { variant: "info" });
      navigate("/dashboard");
    });
    socket.on("ticketCompleted", () => setIsCompleted(true));

    return () => {
      socket.off("receiveMessage");
      socket.off("roomRenamed");
      socket.off("ticketTransferred");
      socket.off("ticketCompleted");
    };
  }, [roomId, navigate, enqueueSnackbar]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const myMsg = {
        senderID: user.accountID,
        messageText: message,
        fileName: null,
      };
      setMessages((prev) => [...prev, myMsg]);
      sendMessage({ roomID: roomId, message });
      setMessage("");
    }
  };

  const handleSendFile = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(",")[1];
        const myMsg = {
          senderID: user.accountID,
          messageText: message,
          fileName: file.name,
        };
        setMessages((prev) => [...prev, myMsg]);
        sendFile({
          roomID: roomId,
          message,
          fileName: file.name,
          fileType: file.type,
          fileData: base64,
        });
        setMessage("");
        setFile(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchStaff = () => {
    getTransferStaff({ searchQuery }, setStaffList);
  };

  const handleTransfer = (newStaffID) => {
    transferTicket(
      { ticketID, newStaffID },
      {
        success: () => setTransferOpen(false),
        error: (msg) => enqueueSnackbar(msg, { variant: "error" }),
      }
    );
  };

  const handleEnd = () => {
    endTicket(
      { ticketID, ratingPoint, ratingDesc },
      {
        success: () => setEndOpen(false),
        error: (msg) => enqueueSnackbar(msg, { variant: "error" }),
      }
    );
  };

  const handleRename = () => {
    renameRoom(
      { roomID: roomId, newName: roomName },
      {
        success: () => enqueueSnackbar("Renamed", { variant: "success" }),
        error: (msg) => enqueueSnackbar(msg, { variant: "error" }),
      }
    );
  };

  const isImage = (fileName) => /\.(jpg|jpeg|png|gif)$/i.test(fileName);

  const handleDownload = (filePath, fileName) => {
    const fullUrl = `${process.env.REACT_APP_FILE_SERVER}${filePath}`;
    console.log("Bắt đầu tải file từ URL: ", fullUrl); // Log URL đầy đủ để kiểm tra cấu hình

    fetch(fullUrl, { mode: "cors" })
      .then((response) => {
        console.log("Response status: ", response.status); // Log mã trạng thái (nên là 200 nếu thành công)
        console.log("Response headers: ", response.headers); // Log headers để xem Content-Type, v.v.
        if (!response.ok) {
          throw new Error(`Lỗi fetch: Status ${response.status}`); // Ném lỗi nếu không OK để bắt ở catch
        }
        return response.blob();
      })
      .then((blob) => {
        console.log(
          "Blob nhận được: Kích thước ",
          blob.size,
          " bytes, Loại: ",
          blob.type
        ); // Log thông tin blob
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((err) => {
        console.error("Lỗi tải file: ", err.message); // Log lỗi chi tiết
        enqueueSnackbar("Download error", { variant: "error" });
      });
  };

  return (
    <div className="chatroom-container">
      {/* Header */}
      <div className="chatroom-header">
        {showBackButton && (
          <button className="back-button" onClick={onBack}>
            ← Trở về danh sách
          </button>
        )}
        <div className="header-content">
          <h4>Phòng chat: {roomName}</h4>
          <input
            className="room-name-input"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Tên phòng"
          />
          <button className="rename-button" onClick={handleRename}>
            Đổi tên
          </button>
        </div>
      </div>


      {/* Nội dung chat */}
      <div className="chat-content">
        <div
          style={{
            height: "300px",
            overflowY: "scroll",
            border: "1px solid #ccc",
            padding: "10px",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "10px",
                textAlign: msg.senderID === user.accountID ? "right" : "left",
              }}
            >
              <strong>
                {msg.senderID === user.accountID ? "You" : "Other"}:
              </strong>
              <Linkify
                componentDecorator={(decoratedHref, decoratedText, key) => (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={decoratedHref}
                    key={key}
                  >
                    {decoratedText}
                  </a>
                )}
              >
                {msg.messageText}
              </Linkify>
              {msg.fileName && (
                <div>
                  {isImage(msg.fileName) ? (
                    <img
                      src={`${process.env.REACT_APP_FILE_SERVER}${msg.filePath}`}
                      alt={msg.fileName}
                      style={{ maxWidth: "200px" }}
                    />
                  ) : (
                    <button
                      onClick={() => handleDownload(msg.filePath, msg.fileName)}
                    >
                      Tải {msg.fileName}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input và nút gửi */}
        {!isCompleted && (
          <div className="input-area">
            <input
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="action-buttons">
              <button className="send-button" onClick={handleSendMessage}>
                Gửi
              </button>
              <button className="file-upload-label">
                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
              </button>
              <button className="file-upload-button" onClick={handleSendFile}>Gửi file</button>
            </div>
          </div>
        )}

        {/* Nút chức năng */}
        <div className="action-bar">
          {user.roleID !== 1 && !isCompleted && (
            <button
              className="transfer-button"
              onClick={() => setTransferOpen(true)}
            >
              Chuyển tiếp
            </button>
          )}
          {user.roleID === 1 && !isCompleted && (
            <button
              className="end-button"
              onClick={() => setEndOpen(true)}
            >
              Kết thúc
            </button>
          )}
        </div>
      </div>

      {/* Modal Chuyển tiếp */}
      {transferOpen && (
        <div className="modal">
          <div className="modal-content">
            <h5>Chuyển tiếp ticket</h5>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhân viên..."
            />
            <button onClick={handleSearchStaff}>Tìm</button>
            <ul className="staff-list">
              {staffList.map((s) => (
                <li
                  key={s.accountID}
                  onClick={() => handleTransfer(s.accountID)}
                >
                  {s.accountName}
                </li>
              ))}
            </ul>
            <button onClick={() => setTransferOpen(false)}>Hủy</button>
          </div>
        </div>
      )}

      {/* Modal Kết thúc */}
      {endOpen && (
        <div className="modal">
          <div className="modal-content">
            <h5>Kết thúc ticket</h5>
            <label>Đánh giá (1-5):</label>
            <input
              type="number"
              min="1"
              max="5"
              value={ratingPoint}
              onChange={(e) => setRatingPoint(e.target.value)}
            />
            <textarea
              value={ratingDesc}
              onChange={(e) => setRatingDesc(e.target.value)}
              placeholder="Mô tả đánh giá..."
            />
            <button onClick={handleEnd}>Xác nhận</button>
            <button onClick={() => setEndOpen(false)}>Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
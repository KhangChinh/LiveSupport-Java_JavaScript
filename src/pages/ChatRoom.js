// File: src/pages/ChatRoom.js
import React, { useState, useEffect, useRef } from "react";
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
  const fileInputRef = useRef(null);

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
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  useEffect(() => {
    console.log("Fetching room info for", roomId);
    getRoomById(
      { roomID: roomId },
      {
        success: (room) => {
          setRoomName(room.roomName);
          setTicketID(room.ticketID);
        },
        error: (msg) => {
          enqueueSnackbar(msg, { variant: "error" });
          console.log("Navigating to dashboard due to error");
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

  const handleSend = () => {
    if (!message.trim() && !file) return;

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
    } else {
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
    console.log("Bắt đầu tải file từ URL: ", fullUrl);

    fetch(fullUrl, { mode: "cors" })
      .then((response) => {
        console.log("Response status: ", response.status);
        console.log("Response headers: ", response.headers);
        if (!response.ok) {
          throw new Error(`Lỗi fetch: Status ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        console.log(
          "Blob nhận được: Kích thước ",
          blob.size,
          " bytes, Loại: ",
          blob.type
        );
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
        console.error("Lỗi tải file: ", err.message);
        enqueueSnackbar("Download error", { variant: "error" });
      });
  };

  return (
    <div className="chatroom-container">
      {/* Header */}
      <div className="chatroom-header">
        {showBackButton && (
          <button className="back-button me-auto mb-2 mb-lg-0" onClick={onBack}>
            ← Trở về
          </button>
        )}
        <div className="header-content ">
          {!isEditingRoomName ? (
            <>
              <div className="room-title">{roomName}</div>
              <button
                className="edit-button"
                onClick={() => setIsEditingRoomName(true)}
              >
                ✏️ Chỉnh sửa
              </button>
            </>
          ) : (
            <>
              <input
                className="room-name-input"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Tên phòng"
                autoFocus
              />
              <button
                className="save-button"
                onClick={() => {
                  handleRename();                    // Gọi API đổi tên
                  setIsEditingRoomName(false);       // Thoát chế độ chỉnh sửa
                }}
              >
                Lưu
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setIsEditingRoomName(false);
                  // Optional: reset về tên cũ nếu cần
                }}
              >
                Hủy
              </button>
            </>
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
              <button className="end-button" onClick={() => setEndOpen(true)}>
                Kết thúc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nội dung chat */}
      <div className="chat-content">
        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message-bubble ${msg.senderID === user.accountID ? "sent" : "received"
                }`}
            >
              <div className="message-content">
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
                  <div className="file-preview">
                    {isImage(msg.fileName) ? (
                      <img
                        src={`${process.env.REACT_APP_FILE_SERVER}${msg.filePath}`}
                        alt={msg.fileName}
                        className="chat-image"
                      />
                    ) : (
                      <div
                        className="download-button"
                        onClick={() =>
                          handleDownload(msg.filePath, msg.fileName)
                        }
                      >
                        Tải {msg.fileName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input và nút gửi */}
        {!isCompleted && (
          <div className="input-area">
            {file && (
              <div className="selected-file-preview">
                <span className="file-name">{file.name}</span>
                <button
                  type="button"
                  className="remove-file-btn bg-danger rounded-pill"
                  onClick={() => setFile(null)}
                  title="Xóa file"
                  style={{ background: "red", color: "white", border: "50%" }}
                >
                  ×
                </button>
              </div>
            )}
            <input
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <label className="file-upload-label">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              <span className="attachment-icon">📎</span>
            </label>
            <button className="send-button" onClick={handleSend}>
              Gửi
            </button>
          </div>
        )}
      </div>

      {transferOpen && (
        <div className="modal-overlay" onClick={() => setTransferOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div className="modal-header">
              <h5>Chuyển tiếp ticket</h5>
              <button
                className="close-btn"
                onClick={() => setTransferOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  autoFocus
                />
                <button
                  className="search-btn"
                  onClick={handleSearchStaff}
                  disabled={!searchQuery.trim()}
                >
                  Tìm
                </button>
              </div>

              <div className="staff-list-container">
                {staffList.length === 0 ? (
                  <p className="no-result">Không tìm thấy nhân viên phù hợp</p>
                ) : (
                  <ul className="staff-list">
                    {staffList.map((staff) => (
                      <li
                        key={staff.accountID}
                        className="staff-item"
                        onClick={() => handleTransfer(staff.accountID)}
                      >
                        <div className="staff-info">
                          {/* Nếu có avatar, thêm vào đây */}
                          <span className="staff-name">{staff.accountName}</span>
                          {staff.email && (
                            <span className="staff-email">{staff.email}</span>
                          )}
                          {staff.roleName && (
                            <span className="staff-role">{staff.roleName}</span>
                          )}
                        </div>
                        <span className="transfer-icon">→</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setTransferOpen(false)}
                style={{ padding: '8px' }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {endOpen && (
        <div className="modal-overlay" onClick={() => setEndOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div className="modal-header">
              <h5>Kết thúc ticket</h5>
              <button
                className="close-btn"
                onClick={() => setEndOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="warning-text">
                Bạn có chắc chắn muốn kết thúc ticket này?
              </p>

              <div className="rating-section">
                <label>Đánh giá chất lượng hỗ trợ:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${ratingPoint >= star ? 'active' : ''}`}
                      onClick={() => setRatingPoint(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <textarea
                className="feedback-textarea"
                value={ratingDesc}
                onChange={(e) => setRatingDesc(e.target.value)}
                placeholder="Nhập mô tả đánh giá (không bắt buộc)..."
                rows={4}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setEndOpen(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleEnd}
                disabled={ratingPoint < 1 || ratingPoint > 5}
              >
                Kết thúc ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;

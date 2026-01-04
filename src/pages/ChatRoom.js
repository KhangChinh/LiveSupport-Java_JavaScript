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

const getFileIcon = (ext) => {
  switch (ext) {
    case "pdf":
      return "📄";
    case "docx":
      return "📝";
    case "xlsx":
      return "📊";
    case "txt":
      return "📄";
    default:
      return "📁";
  }
};

const ChatRoom = ({ onBack, showBackButton = false }) => {
  const { roomId } = useParams();
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
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
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate("/history");
      return;
    }

    console.log("Fetching room info for", roomId);
    getRoomById(
      { roomID: roomId },
      {
        success: (room) => {
          setRoomName(room.roomName);
          setTicketID(room.ticketID);
          setIsCompleted(room.ticketStatusID === 4);
        },
        error: (msg) => {
          enqueueSnackbar(msg, { variant: "error" });
          navigate("/history");
        },
      }
    );

    joinRoom(
      { roomID: roomId },
      {
        success: () => loadHistory({ roomID: roomId }, (history) => {
          setMessages(history);
          scrollToBottom();
        }),
        error: (msg) => {
          enqueueSnackbar(msg, { variant: "error" });
          navigate("/dashboard");
        },
      }
    );

    socket.on("receiveMessage", (msg) => {
      console.log("Received message", msg);
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      setShowScrollButton(scrollTop + clientHeight < scrollHeight - 100);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // Giới hạn 10MB
        enqueueSnackbar("File quá lớn (tối đa 10MB). Video lớn vui lòng nén trước.", { variant: "warning" });
        return;
      }
      setFile(selectedFile);
    }
  };

  const removeSelectedFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getCleanPath = (filePath) => {
    if (!filePath) return '';
    if (typeof filePath !== 'string') return '';
    if (filePath.startsWith('/files/')) {
      return filePath.substring('/files'.length);
    }
    return filePath;
  };

  const getFileUrl = (filePath) => {
    // Nếu filePath là URL đầy đủ (từ Cloudinary), dùng trực tiếp
    if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
      return filePath;
    }
    // Nếu là path local, prepend file server URL
    const cleanPath = getCleanPath(filePath);
    return `${process.env.REACT_APP_FILE_SERVER}${cleanPath}`;
  };

  const handleDownload = (filePath, fileName) => {
    const fileUrl = getFileUrl(filePath);
    console.log("Tải file từ URL:", fileUrl); // Log để debug

    fetch(fileUrl, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
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
      .catch((error) => {
        console.error("Lỗi tải file:", error);
        enqueueSnackbar("Không thể tải file. Vui lòng thử lại.", { variant: "error" });
      });
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
        if (fileInputRef.current) fileInputRef.current.value = "";
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

  return (
    <div className="chatroom-container">
      <div className="chatroom-header">
        {showBackButton && (
          <button className="back-button" onClick={onBack}>
            Trở về
          </button>
        )}
        {isCompleted && <span className="completed-label">Completed</span>}

        <div className="header-content">
          {isEditingRoomName ? (
            <>
              <input
                className="room-name-input"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <button
                className="save-button"
                onClick={() => {
                  renameRoom(
                    { roomID: roomId, newName: roomName },
                    {
                      success: () => {
                        console.log("Rename room success");
                        setIsEditingRoomName(false);
                        enqueueSnackbar("Đổi tên phòng thành công", { variant: "success" });
                      },
                      error: (msg) => {
                        console.error("Rename room error:", msg);
                        enqueueSnackbar(msg || "Lỗi khi đổi tên phòng", { variant: "error" });
                      },
                    }
                  );
                }}
              >
                Lưu
              </button>
              <button
                className="cancel-button"
                onClick={() => setIsEditingRoomName(false)}
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              <h5 className="room-name">{roomName}</h5>
              <button
                className="edit-button"
                onClick={() => setIsEditingRoomName(true)}
              >
                ✏️
              </button>
            </>
          )}

          {user.roleID === 2 && !isCompleted && (
            <>
              <button
                className="transfer-button"
                onClick={() => setTransferOpen(true)}
              >
                Chuyển tiếp
              </button>
            </>
          )}
          {user.roleID === 1 && (
            <button className="end-button" onClick={() => setEndOpen(true)}>
              Kết thúc
            </button>
          )}
        </div>
      </div>

      <div className="chat-content">
        <div className="messages-container" ref={messagesContainerRef}>
          {messages.map((msg, index) => {
            const ext = getExtension(msg.fileName || "");
            const fileUrl = getFileUrl(msg.filePath);

            return (
              <div
                key={index}
                className={`message-bubble ${msg.senderID === user.accountID ? "sent" : "received"}`}
              >
                <div className="message-content">
                  {msg.messageText && <Linkify>{msg.messageText}</Linkify>}
                  {msg.fileID && msg.filePath && (
                    <div className="media-container">
                      {["jpg", "jpeg", "png", "gif"].includes(ext) ? (
                        <div className="image-wrapper">
                          <img src={fileUrl} alt={msg.fileName} className="chat-image" />
                          <div
                            className="download-icon"
                            title="Tải xuống"
                            onClick={() => handleDownload(msg.filePath, msg.fileName)}
                          >
                            ↓
                          </div>
                        </div>
                      ) : ["mp4", "webm", "ogg", "mov"].includes(ext) ? (
                        <div className="video-wrapper">
                          <video controls src={fileUrl} className="chat-video">
                            Trình duyệt không hỗ trợ video.
                          </video>
                          <div
                            className="download-icon"
                            title="Tải xuống"
                            onClick={() => handleDownload(msg.filePath, msg.fileName)}
                          >
                            ↓
                          </div>
                        </div>
                      ) : (
                        <div className="file-attachment"
                          style={{ color: "#60cf24ff" }}>
                          <span className="file-icon">{getFileIcon(ext)}</span>
                          <span className="file-name">{msg.fileName}</span>
                          <div
                            className="download-icon"
                            title="Tải xuống"
                            onClick={() => handleDownload(msg.filePath, msg.fileName)}
                          >
                            ↓
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="message-time">
                  {msg.sentAt && !isNaN(new Date(msg.sentAt).getTime())
                    ? new Date(msg.sentAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {showScrollButton && (
          <button className="scroll-to-bottom" onClick={scrollToBottom} title="Cuộn xuống dưới">
            ↓
          </button>
        )}

        {!isCompleted && (
          <div className="input-area">
            {file && (
              <div className="selected-file-preview">
                <span className="file-icon-preview">{getFileIcon(getExtension(file.name))}</span>
                <span className="selected-file-name">{file.name}</span>
                <button className="remove-file-btn" onClick={removeSelectedFile}>
                  ×
                </button>
              </div>
            )}

            <input
              type="text"
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập tin nhắn..."
            />
            <label className="file-upload-label">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              📎
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
            style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}>
            <div className="modal-header">
              <h5>Chuyển tiếp ticket</h5>
              <button className="close-btn" onClick={() => setTransferOpen(false)}>
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
                          <span className="staff-name">{staff.accountName}</span>
                          {staff.email && <span className="staff-email">{staff.email}</span>}
                          {staff.roleName && <span className="staff-role">{staff.roleName}</span>}
                        </div>
                        <span className="transfer-icon">→</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTransferOpen(false)}
                style={{ backgroundColor: "red" }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {endOpen && (
        <div className="modal-overlay" onClick={() => setEndOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px' }}>
            <div className="modal-header">
              <h5>Kết thúc ticket</h5>
              <button className="close-btn" onClick={() => setEndOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="warning-text">Bạn có chắc chắn muốn kết thúc ticket này?</p>
              <div className="rating-section">
                <label>Đánh giá chất lượng hỗ trợ:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${ratingPoint >= star ? "active" : ""}`}
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
              <button className="btn btn-secondary" onClick={() => setEndOpen(false)}
                style={{ backgroundColor: "red", marginRight: '10px' }}>
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleEnd}
                disabled={ratingPoint < 1 || ratingPoint > 5}
                style={{ backgroundColor: "#349302ff" }}
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
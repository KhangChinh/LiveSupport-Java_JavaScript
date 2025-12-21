// File: src/pages/ChatRoom.js
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import Linkify from "react-linkify"; // Thêm import
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

const getExtension = (fileName) => {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.substring(dotIndex + 1).toLowerCase();
};

const ChatRoom = () => {
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
  }, [roomId, navigate]);

  const handleSendMessage = () => {
    if (message) {
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
    fetch(filePath, { mode: "cors" })
      .then((response) => response.blob())
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
      .catch(() => enqueueSnackbar("Download error", { variant: "error" }));
  };

  return (
    <div className="container mt-5">
      <h2>Chat Room</h2>
      <input
        className="form-control mb-3"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Tên phòng"
      />
      <button className="btn btn-secondary mb-3" onClick={handleRename}>
        Đổi tên
      </button>
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
                    src={`${process.env.REACT_APP_FILE_SERVER}/${getExtension(
                      msg.fileName
                    )}/${msg.fileName}`}
                    alt={msg.fileName}
                    style={{ maxWidth: "200px" }}
                  />
                ) : (
                  <button
                    onClick={() =>
                      handleDownload(
                        `${process.env.REACT_APP_FILE_SERVER}/${getExtension(
                          msg.fileName
                        )}/${msg.fileName}`,
                        msg.fileName
                      )
                    }
                  >
                    Tải {msg.fileName}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {!isCompleted && (
        <div>
          <input
            className="form-control mb-3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tin nhắn"
          />
          <button className="btn btn-primary" onClick={handleSendMessage}>
            Gửi Text
          </button>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button className="btn btn-primary" onClick={handleSendFile}>
            Gửi File
          </button>
        </div>
      )}
      {user.roleID !== 1 && !isCompleted && (
        <button
          className="btn btn-warning"
          onClick={() => setTransferOpen(true)}
        >
          Chuyển tiếp
        </button>
      )}
      {user.roleID === 1 && !isCompleted && (
        <button className="btn btn-danger" onClick={() => setEndOpen(true)}>
          Kết thúc
        </button>
      )}
      {transferOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "20px",
            border: "1px solid black",
          }}
        >
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm staff"
          />
          <button onClick={handleSearchStaff}>Tìm</button>
          <ul>
            {staffList.map((s) => (
              <li
                key={s.accountID}
                onClick={() => handleTransfer(s.accountID)}
                style={{ cursor: "pointer" }}
              >
                {s.accountName}
              </li>
            ))}
          </ul>
          <button onClick={() => setTransferOpen(false)}>Hủy</button>
        </div>
      )}
      {endOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "20px",
            border: "1px solid black",
          }}
        >
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
            placeholder="Mô tả"
          />
          <button onClick={handleEnd}>Xác nhận</button>
          <button onClick={() => setEndOpen(false)}>Hủy</button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;

// src/components/HistoryList.js
import React, { useState, useEffect } from "react";
import { getMyRooms, getMyRoomsCount } from "../services/RoomService";
import "./HistoryList.scss";
import { FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const HistoryList = ({ selectedRoomId, onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("LastMessageTime DESC");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    getMyRooms({ search, sort, page, limit }, (receivedRooms) => {
      console.log("Received rooms from server:", receivedRooms);
      setRooms(receivedRooms);
    });
    getMyRoomsCount({ search }, (count) => {
      console.log("Received room count:", count);
      setTotal(count);
    });
  }, [search, sort, page]);

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (statusID) => {
    const map = {
      1: { text: "Pending", variant: "warning" },
      2: { text: "Accepted", variant: "success" },
      3: { text: "Rejected", variant: "danger" },
      4: { text: "Completed", variant: "secondary" },
    };
    const { text = "Unknown", variant = "secondary" } = map[statusID] || {};
    return <span className={`badge bg-${variant} px-3 py-2`}>{text}</span>;
  };

  return (
    <div className="history-list">
      <div className="history-list__header">
        <h3 className="history-list__title">Lịch sử hội thoại</h3>
      </div>

      <div className="history-list__controls">
        <div className="search-wrapper">

          <input
            type="text"
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên phòng..."
          />
        </div>

        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="LastMessageTime DESC">Mới nhất trước</option>
          <option value="LastMessageTime ASC">Cũ nhất trước</option>
          <option value="RoomName ASC">Tên phòng A-Z</option>
          <option value="RoomName DESC">Tên phòng Z-A</option>
        </select>
      </div>

      <div className="history-list__content">
        {rooms.length === 0 ? (
          <p className="no-results">Không tìm thấy hội thoại nào</p>
        ) : (
          <ul className="room-list">
            {rooms.map((room) => (
              <li
                key={room.roomID}
                className={`room-item ${room.roomID === selectedRoomId ? "active" : ""
                  }`}
                onClick={() => onSelectRoom(room.roomID)}
              >
                <div className="room-info">
                  <div className="room-name">{room.roomName || "Khách hàng không tên"}</div>
                  <div className="room-last-message">
                    {room.lastMessage
                      ? room.lastMessage.substring(0, 60) + "..."
                      : "Chưa có tin nhắn"}
                  </div>
                  {getStatusBadge(room.ticketStatusID)}
                </div>
                <div className="room-time">
                  {room.lastMessageTime
                    ? new Date(room.lastMessageTime).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })
                    : "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="history-list__pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <FiChevronLeft />
          </button>
          <span className="pagination-text">Trang {page} / {totalPages}</span>
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
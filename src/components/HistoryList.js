// src/components/HistoryList.js
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getMyRooms, getMyRoomsCount } from "../services/RoomService";
import "./HistoryList.scss";
import { FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const HistoryList = ({ selectedRoomId, onSelectRoom }) => {
    const user = useSelector((state) => state.user);
    const [rooms, setRooms] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("LastMessageTime DESC");
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        getMyRooms({ search, sort, page, limit }, setRooms);
        getMyRoomsCount({ search }, setTotal);
    }, [search, sort, page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="history-list">
            <div className="history-list__header">
                <h3 className="history-list__title">Lịch sử hội thoại</h3>
            </div>

            <div className="history-list__controls">
                <div className="search-wrapper">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Tìm theo tên khách hàng hoặc phòng..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <select
                    className="sort-select"
                    value={sort}
                    onChange={(e) => {
                        setSort(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="LastMessageTime DESC">Mới nhất trước</option>
                    <option value="LastMessageTime ASC">Cũ nhất trước</option>
                </select>
            </div>

            <div className="history-list__body">
                {rooms.length === 0 ? (
                    <div className="no-results">
                        Không tìm thấy hội thoại nào.
                    </div>
                ) : (
                    <ul className="room-list">
                        {rooms.map((room) => (
                            <li
                                key={room.roomID}
                                className={`room-item ${selectedRoomId === room.roomID ? "active" : ""}`}
                                onClick={() => onSelectRoom(room.roomID)}
                            >
                                <div className="room-info">
                                    <div className="room-name">{room.roomName || "Khách hàng không tên"}</div>
                                    <div className="room-last-message">
                                        {room.lastMessage ? room.lastMessage.substring(0, 60) + "..." : "Chưa có tin nhắn"}
                                    </div>
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
                    <span className="pagination-text">
                        Trang {page} / {totalPages}
                    </span>
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
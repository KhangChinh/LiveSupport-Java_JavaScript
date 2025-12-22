import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getMyRooms, getMyRoomsCount } from "../services/RoomService";
import "./HistoryList.scss";

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

    return (
        <div className="history-list-container">
            <h3>Lịch sử chat</h3>

            <input
                className="search-input"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                }}
                placeholder="Tìm tên phòng..."
            />

            <select
                className="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
            >
                <option value="LastMessageTime DESC">Mới nhất</option>
                <option value="LastMessageTime ASC">Cũ nhất</option>
            </select>

            <table className="room-table">
                <thead>
                    <tr>
                        <th>Tên phòng</th>
                        <th>Tin cuối</th>
                        <th>Thời gian</th>
                    </tr>
                </thead>
                <tbody>
                    {rooms.map((r) => (
                        <tr
                            key={r.roomID}
                            className={`room-row ${selectedRoomId === r.roomID ? "selected" : ""}`}
                            onClick={() => onSelectRoom(r.roomID)}
                        >
                            <td>{r.roomName}</td>
                            <td>{r.lastMessage || "—"}</td>
                            <td>{r.lastMessageTime || "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    style={{ marginRight: "1rem" }}
                >
                    Prev
                </button>
                <span>
                    Trang {page} / {Math.ceil(total / limit)}
                </span>
                <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * limit >= total}
                    style={{ marginLeft: "1rem" }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default HistoryList;
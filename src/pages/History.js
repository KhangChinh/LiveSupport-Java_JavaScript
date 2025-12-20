// File: src/pages/History.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getMyRooms, getMyRoomsCount } from '../services/RoomService';
import { Link } from 'react-router-dom';

const History = () => {
    const user = useSelector((state) => state.user);
    const [rooms, setRooms] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('LastMessageTime DESC');
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        getMyRooms({ search, sort, page, limit }, setRooms);
        getMyRoomsCount({ search }, setTotal);
    }, [search, sort, page]);

    return (
        <div>
            <h2>Lịch sử Phòng Chat</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên phòng" />
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="LastMessageTime DESC">Mới nhất</option>
                <option value="LastMessageTime ASC">Cũ nhất</option>
            </select>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid black' }}>Tên phòng</th>
                        <th style={{ border: '1px solid black' }}>Tin cuối</th>
                        <th style={{ border: '1px solid black' }}>Thời gian</th>
                        <th style={{ border: '1px solid black' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rooms.map(r => (
                        <tr key={r.roomID}>
                            <td style={{ border: '1px solid black' }}>{r.roomName}</td>
                            <td style={{ border: '1px solid black' }}>{r.lastMessage}</td>
                            <td style={{ border: '1px solid black' }}>{r.lastMessageTime}</td>
                            <td style={{ border: '1px solid black' }}><Link to={`/chat/${r.roomID}`}>Mở</Link></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</button>
            <button onClick={() => setPage(page + 1)} disabled={page * limit >= total}>Next</button>
        </div>
    );
};

export default History;
// File: src/pages/TicketList.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getMyTickets, getMyTicketsCount } from '../services/TicketService';
import socket from '../services/SocketService';
import { Link } from 'react-router-dom';

const TicketList = () => {
    const user = useSelector((state) => state.user);
    const [tickets, setTickets] = useState([]);
    const [total, setTotal] = useState(0);
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('CreatedAt DESC');
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        getMyTickets({ filterStatus: filterStatus || '', search, sort, page, limit }, setTickets);
        getMyTicketsCount({ filterStatus: filterStatus || '', search }, setTotal);
        socket.on('ticketAccepted', () => getMyTickets({ filterStatus, search, sort, page, limit }, setTickets));
        socket.on('ticketRejected', () => getMyTickets({ filterStatus, search, sort, page, limit }, setTickets));
        socket.on('ticketTransferred', () => getMyTickets({ filterStatus, search, sort, page, limit }, setTickets));
        socket.on('ticketCompleted', () => getMyTickets({ filterStatus, search, sort, page, limit }, setTickets));
        return () => {
            socket.off('ticketAccepted');
            socket.off('ticketRejected');
            socket.off('ticketTransferred');
            socket.off('ticketCompleted');
        };
    }, [filterStatus, search, sort, page]);

    if (user.roleID !== 1) return <div>Unauthorized</div>;
    console.log(tickets);
    return (
        <div className="container mt-5">
            <h2>Ticket của tôi</h2>
            <input className="form-control mb-3" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm" />
            <select className="form-control mb-3" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="1">Pending</option>
                <option value="2">Accept</option>
                <option value="3">Reject</option>
                <option value="4">Complete</option>
            </select>
            <select className="form-control mb-3" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="CreatedAt DESC">Mới nhất</option>
                <option value="CreatedAt ASC">Cũ nhất</option>
            </select>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Mô tả</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.map(t => (
                        <tr key={t.ticketID}>
                            <td>{t.ticketID}</td>
                            <td>{t.ticketDescription}</td>
                            <td>{t.ticketStatusID}</td>
                            <td>
                                {t.roomID && t.ticketStatusID === 2 && <Link to={`/chat/${t.roomID}`}>Chat</Link>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="btn btn-secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</button>
            <button className="btn btn-secondary" onClick={() => setPage(page + 1)} disabled={page * limit >= total}>Next</button>
        </div>
    );
};

export default TicketList;
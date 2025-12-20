// File: src/pages/StaffTicketList.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getMyTickets, acceptTicket, rejectTicket, getMyTicketsCount } from '../services/TicketService';
import socket from '../services/SocketService';
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const StaffTicketList = () => {
    const user = useSelector((state) => state.user);
    const { enqueueSnackbar } = useSnackbar();
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
        socket.on('ticketTransferred', () => getMyTickets({ filterStatus, search, sort, page, limit }, setTickets));
        return () => socket.off('ticketTransferred');
    }, [filterStatus, search, sort, page]);

    const handleAccept = (ticketID) => {
        acceptTicket({ ticketID }, {
            success: () => {
                enqueueSnackbar('Accepted', { variant: 'success' });
                getMyTickets({ filterStatus, search, sort, page, limit }, setTickets);
            },
            error: (msg) => enqueueSnackbar(msg, { variant: 'error' }),
        });
    };

    const handleReject = (ticketID) => {
        rejectTicket({ ticketID }, {
            success: () => {
                enqueueSnackbar('Rejected', { variant: 'success' });
                getMyTickets({ filterStatus, search, sort, page, limit }, setTickets);
            },
            error: (msg) => enqueueSnackbar(msg, { variant: 'error' }),
        });
    };

    return (
        <div className="container mt-5">
            <h2>Ticket hỗ trợ</h2>
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
                                {t.ticketStatusID === 1 && (
                                    <>
                                        <button className="btn btn-success" onClick={() => handleAccept(t.ticketID)}>Accept</button>
                                        <button className="btn btn-danger" onClick={() => handleReject(t.ticketID)}>Reject</button>
                                    </>
                                )}
                                {t.roomID && <Link to={`/chat/${t.roomID}`}>Chat</Link>}
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

export default StaffTicketList;
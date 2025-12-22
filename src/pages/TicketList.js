// src/pages/TicketList.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getMyTickets, getMyTicketsCount } from '../services/TicketService';
import socket from '../services/SocketService';
import { Link } from 'react-router-dom';
import styles from './TicketList.scss'; // Import SCSS module

const TicketList = () => {
    const user = useSelector((state) => state.user);
    const [tickets, setTickets] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('CreatedAt DESC');
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchTickets = async () => {
        setLoading(true);
        try {
            await getMyTickets({ filterStatus: filterStatus || '', search, sort, page, limit }, setTickets);
            await getMyTicketsCount({ filterStatus: filterStatus || '', search }, setTotal);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();

        const handleTicketUpdate = () => fetchTickets();
        socket.on('ticketAccepted', handleTicketUpdate);
        socket.on('ticketRejected', handleTicketUpdate);
        socket.on('ticketTransferred', handleTicketUpdate);
        socket.on('ticketCompleted', handleTicketUpdate);

        return () => {
            socket.off('ticketAccepted', handleTicketUpdate);
            socket.off('ticketRejected', handleTicketUpdate);
            socket.off('ticketTransferred', handleTicketUpdate);
            socket.off('ticketCompleted', handleTicketUpdate);
        };
    }, [filterStatus, search, sort, page]);

    if (user.roleID !== 1) {
        return <div className="alert alert-danger text-center mt-5">Unauthorized</div>;
    }

    const totalPages = Math.ceil(total / limit);

    const getStatusBadge = (statusID) => {
        const statusMap = {
            1: { text: 'Pending', variant: 'warning' },
            2: { text: 'Accepted', variant: 'success' },
            3: { text: 'Rejected', variant: 'danger' },
            4: { text: 'Completed', variant: 'secondary' },
        };
        const { text = 'Unknown', variant = 'secondary' } = statusMap[statusID] || {};
        return <span className={`badge bg-${variant} px-3 py-2`}>{text}</span>;
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Ticket Hỗ Trợ Của Tôi</h2>
                <div className="text-muted">
                    Tổng: <strong>{total}</strong> ticket
                </div>
            </div>


            <div className="row g-3 mb-4">
                <div className="col-md-5">
                    <input
                        className="form-control form-control-lg"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1); // Reset về trang 1 khi tìm kiếm
                        }}
                        placeholder="Tìm kiếm theo tên phòng hoặc mô tả..."
                    />
                </div>
                <div className="col-md-3">
                    <select
                        className="form-select form-select-lg"
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="1">Pending</option>
                        <option value="2">Accepted</option>
                        <option value="3">Rejected</option>
                        <option value="4">Completed</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <select
                        className="form-select form-select-lg"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="CreatedAt DESC">Mới nhất trước</option>
                        <option value="CreatedAt ASC">Cũ nhất trước</option>
                    </select>
                </div>
            </div>


            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : tickets.length === 0 ? (
                <div className="alert alert-info text-center py-5">
                    Không tìm thấy ticket nào phù hợp với bộ lọc hiện tại.
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className={`table table-hover ${styles.ticketTable}`}>
                            <thead className="table-dark">
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Mô tả</th>
                                    <th scope="col">Trạng thái</th>
                                    <th scope="col">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={ticket.ticketID}>
                                        <td className="fw-bold">#{ticket.ticketID}</td>
                                        <td>{ticket.ticketDescription || '—'}</td>
                                        <td>{getStatusBadge(ticket.ticketStatusID)}</td>
                                        <td>
                                            {ticket.roomID && ticket.ticketStatusID === 2 ? (
                                                <Link
                                                    to={`/chat/${ticket.roomID}`}
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    <i className="bi bi-chat-dots me-1"></i> Chat
                                                </Link>
                                            ) : (
                                                <span className="text-muted">Chưa có đoạn chat</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <nav aria-label="Page navigation" className="mt-4">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Trước
                                    </button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p)}>
                                            {p}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Sau
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
};

export default TicketList;
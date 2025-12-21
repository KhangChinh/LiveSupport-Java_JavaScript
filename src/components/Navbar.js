// File: src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { logout } from '../services/AccountService';
import { getMyNotifications } from '../services/NotificationService';
import socket from '../services/SocketService';

const Navbar = () => {
    const user = useSelector((state) => state.user);
    const notifications = useSelector((state) => state.notifications);
    const sessionId = useSelector((state) => state.sessionId);
    const dispatch = useDispatch();
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (user) {
            getMyNotifications((notis) => dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: notis }));
            socket.on('newNotification', (noti) => {
                dispatch({ type: 'ADD_NOTIFICATION', payload: noti });
                console.log('New notification:', noti);
            });
            return () => socket.off('newNotification');
        }
    }, [user]);

    const handleLogout = () => {
        logout(sessionId);
        dispatch({ type: 'LOGOUT' });
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
        socket.disconnect();
        socket.connect();
    };

    const handleShowNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    if (!user) return null;

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link" to="/dashboard">Dashboard</Link>
                        </li>
                        {user.roleID === 1 && (
                            <li className="nav-item">
                                <Link className="nav-link" to="/tickets/create">Tạo Ticket</Link>
                            </li>
                        )}
                        <li className="nav-item">
                            <Link className="nav-link" to={user.roleID === 1 ? "/tickets/my" : "/tickets/staff"}>Tickets</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/history">Lịch sử</Link>
                        </li>
                        {user.roleID === 2 && (
                            <li className="nav-item">
                                <Link className="nav-link" to="/admin/users">Quản lý User</Link>
                            </li>
                        )}
                        <li className="nav-item">
                            <button className="nav-link btn btn-link" onClick={handleShowNotifications}>
                                Thông báo ({notifications.length})
                            </button>
                            {showNotifications && (
                                <div style={{ position: 'absolute', background: 'white', border: '1px solid #ccc', padding: '10px', zIndex: 1000 }}>
                                    {notifications.map((noti, idx) => (
                                        <div key={idx} style={{ marginBottom: '10px' }}>
                                            {noti.notificationDescription} - {new Date(noti.createdAt).toLocaleString()}
                                        </div>
                                    ))}
                                    {notifications.length === 0 && <div>Không có thông báo</div>}
                                </div>
                            )}
                        </li>
                        <li className="nav-item">
                            <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
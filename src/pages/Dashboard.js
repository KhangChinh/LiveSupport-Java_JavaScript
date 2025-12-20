// File: src/pages/Dashboard.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
    const user = useSelector((state) => state.user);

    if (!user) return <Navigate to="/login" />;
    console.log(user)
    return (
        <div className="container mt-5">
            <h2>Chào mừng, {user.accountName}</h2>
            <p>Role: {user.roleID === 1 ? 'Khách hàng' : user.roleID === 2 ? 'Admin' : 'Hỗ trợ viên'}</p>
        </div>
    );
};

export default Dashboard;
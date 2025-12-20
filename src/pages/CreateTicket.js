// File: src/pages/CreateTicket.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getRoles } from '../services/AccountService';
import { getStaffByRole } from '../services/AccountService';
import { createTicket } from '../services/TicketService';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const CreateTicket = () => {
    const user = useSelector((state) => state.user);
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [roleID, setRoleID] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        getRoles(setRoles);
    }, []);

    const handleRoleChange = (e) => {
        setRoleID(e.target.value);
        setStaffList([]);
        setSelectedStaff(null);
        if (e.target.value) {
            getStaffByRole({ roleID: e.target.value, searchQuery: '' }, setStaffList);
        }
    };

    const handleSearchStaff = () => {
        if (roleID) {
            getStaffByRole({ roleID, searchQuery }, setStaffList);
        }
    };

    const handleCreate = () => {
        createTicket({ description, roleID, staffID: selectedStaff }, {
            success: () => {
                enqueueSnackbar('Ticket created', { variant: 'success' });
                navigate('/tickets/my');
            },
            error: (msg) => enqueueSnackbar(msg, { variant: 'error' }),
        });
    };

    return (
        <div className="container mt-5">
            <h2>Tạo Ticket</h2>
            <select className="form-control mb-3" onChange={handleRoleChange} value={roleID}>
                <option value="">Chọn loại hỗ trợ</option>
                {roles.filter(r => r.roleID !== 1).map(r => <option key={r.roleID} value={r.roleID}>{r.roleName}</option>)}
            </select>
            {roleID && (
                <div>
                    <input className="form-control mb-3" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm staff" />
                    <button className="btn btn-secondary mb-3" onClick={handleSearchStaff}>Tìm</button>
                    <ul className="list-group mb-3">
                        {staffList.map(s => (
                            <li key={s.accountID} className={`list-group-item ${selectedStaff === s.accountID ? 'active' : ''}`} onClick={() => setSelectedStaff(s.accountID)} style={{ cursor: 'pointer' }}>
                                {s.accountName}
                            </li>
                        ))}
                    </ul>
                    <button className="btn btn-secondary mb-3" onClick={() => setSelectedStaff(null)}>Không chỉ định</button>
                </div>
            )}
            <textarea className="form-control mb-3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả" />
            <button className="btn btn-primary" onClick={handleCreate} disabled={!roleID}>Tạo</button>
        </div>
    );
};

export default CreateTicket;
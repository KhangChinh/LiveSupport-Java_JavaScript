// src/pages/CreateTicket.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { getRoles, getStaffByRole } from '../services/AccountService';
import { createTicket } from '../services/TicketService';
import './CreateTicket.scss';

const CreateTicket = () => {
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const [roles, setRoles] = useState([]);
    const [roleID, setRoleID] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);

    useEffect(() => {
        getRoles(setRoles);
    }, []);

    const handleRoleChange = async (e) => {
        const newRoleID = e.target.value;
        setRoleID(newRoleID);
        setStaffList([]);
        setSelectedStaff(null);
        setSearchQuery('');

        if (newRoleID) {
            setIsLoadingStaff(true);
            await getStaffByRole({ roleID: newRoleID, searchQuery: '' }, setStaffList);
            setIsLoadingStaff(false);
        }
    };

    const handleSearchStaff = async () => {
        if (roleID) {
            setIsLoadingStaff(true);
            await getStaffByRole({ roleID, searchQuery }, setStaffList);
            setIsLoadingStaff(false);
        }
    };

    const handleCreate = async () => {
        if (!roleID || !description.trim()) return;

        createTicket(
            { description, roleID, staffID: selectedStaff },
            {
                success: () => {
                    enqueueSnackbar('Ticket đã được tạo thành công', { variant: 'success' });
                    navigate('/tickets/my');
                },
                error: (msg) => enqueueSnackbar(msg, { variant: 'error' }),
            }
        );
    };

    return (
        <div className="create-ticket">
            <div className="create-ticket__card">
                <div className="create-ticket__header">
                    <h1 className="create-ticket__title">Tạo Ticket Hỗ Trợ</h1>
                    <p className="create-ticket__subtitle">
                        Vui lòng cung cấp thông tin để chúng tôi hỗ trợ bạn nhanh chóng nhất.
                    </p>
                </div>

                <div className="create-ticket__form">
                    {/* Phần 1: Chọn loại hỗ trợ */}
                    <div className="form-section">
                        <label htmlFor="roleSelect" className="form-label required">
                            Loại hỗ trợ
                        </label>
                        <select
                            id="roleSelect"
                            className="form-select"
                            value={roleID}
                            onChange={handleRoleChange}
                            required
                        >
                            <option value="">Chọn loại hỗ trợ...</option>
                            {roles
                                .filter((r) => r.roleID !== 1)
                                .map((r) => (
                                    <option key={r.roleID} value={r.roleID}>
                                        {r.roleName}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Phần 2: Chọn nhân viên (nếu có) */}
                    {roleID && (
                        <div className="form-section staff-section">
                            <label htmlFor="staffSearch" className="form-label">
                                Nhân viên hỗ trợ (tùy chọn)
                            </label>
                            <div className="staff-search">
                                <input
                                    id="staffSearch"
                                    type="text"
                                    className="form-input"
                                    placeholder="Tìm theo tên nhân viên..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchStaff()}
                                />
                                <button
                                    type="button"
                                    className="btn btn-search"
                                    onClick={handleSearchStaff}
                                    disabled={isLoadingStaff}
                                >
                                    {isLoadingStaff ? 'Đang tìm...' : 'Tìm'}
                                </button>
                            </div>

                            {isLoadingStaff ? (
                                <div className="staff-loading">Đang tải danh sách nhân viên...</div>
                            ) : staffList.length > 0 ? (
                                <div className="staff-list-container">
                                    <ul className="staff-list">
                                        {staffList.map((staff) => (
                                            <li
                                                key={staff.accountID}
                                                className={`staff-item ${selectedStaff === staff.accountID ? 'selected' : ''
                                                    }`}
                                                onClick={() => setSelectedStaff(staff.accountID)}
                                            >
                                                {staff.accountName}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                searchQuery && <p className="no-result">Không tìm thấy nhân viên nào.</p>
                            )}

                            {selectedStaff && (
                                <button
                                    type="button"
                                    className="btn btn-clear"
                                    onClick={() => setSelectedStaff(null)}
                                >
                                    Xóa lựa chọn
                                </button>
                            )}
                        </div>
                    )}

                    {/* Phần 3: Mô tả */}
                    <div className="form-section">
                        <label htmlFor="description" className="form-label required">
                            Mô tả vấn đề
                        </label>
                        <textarea
                            id="description"
                            className="form-textarea"
                            rows={6}
                            placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    {/* Nút hành động */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreate}
                            disabled={!roleID || !description.trim() || isLoadingStaff}
                        >
                            Tạo Ticket
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/tickets/my')}
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTicket;
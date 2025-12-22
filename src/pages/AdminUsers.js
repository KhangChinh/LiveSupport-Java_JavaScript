// src/pages/AdminUsers.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getAllAccounts, createAccount, getRoles } from '../services/AccountService';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import styles from './AdminUsers.scss';

const CreateSchema = Yup.object().shape({
    email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
    password: Yup.string().min(8, 'Mật khẩu phải ít nhất 8 ký tự').required('Vui lòng nhập mật khẩu'),
    accountName: Yup.string().required('Vui lòng nhập tên'),
    roleID: Yup.number().required('Vui lòng chọn vai trò'),
});

const AdminUsers = () => {
    const user = useSelector((state) => state.user);
    const { enqueueSnackbar } = useSnackbar();
    const [accounts, setAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await getAllAccounts(setAccounts);
                await getRoles(setRoles);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreate = (values, { resetForm }) => {
        createAccount(values, {
            success: () => {
                enqueueSnackbar('Tạo tài khoản thành công', { variant: 'success' });
                setShowModal(false);
                resetForm();
                getAllAccounts(setAccounts);
            },
            error: (msg) => enqueueSnackbar(msg, { variant: 'error' }),
        });
    };

    if (user.roleID !== 2) {
        return <div className="alert alert-danger text-center mt-5">Unauthorized</div>;
    }

    const filteredAccounts = accounts.filter(
        (acc) =>
            acc.email.toLowerCase().includes(search.toLowerCase()) ||
            acc.accountName.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleName = (roleID) => {
        const role = roles.find((r) => r.roleID === roleID);
        return role ? role.roleName : 'Unknown';
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Quản lý Tài khoản</h2>
                <div className="text-muted">
                    Tổng: <strong>{filteredAccounts.length}</strong> tài khoản
                </div>
            </div>

            {/* Search & Create Button */}
            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <input
                        className="form-control form-control-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm theo email hoặc tên..."
                    />
                </div>
                <div className="col-md-6 text-md-end">
                    <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                        <i className="bi bi-plus-circle me-2"></i> Tạo tài khoản mới
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            ) : filteredAccounts.length === 0 ? (
                <div className="alert alert-info text-center py-5">
                    Không tìm thấy tài khoản nào phù hợp.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className={`table table-hover ${styles.userTable}`}>
                        <thead className="table-dark">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Email</th>
                                <th scope="col">Tên</th>
                                <th scope="col">Vai trò</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.map((acc) => (
                                <tr key={acc.accountID}>
                                    <td className="fw-bold">#{acc.accountID}</td>
                                    <td>{acc.email}</td>
                                    <td>{acc.accountName}</td>
                                    <td>
                                        <span className={`badge bg-${acc.roleID === 1 ? 'info' : acc.roleID === 2 ? 'primary' : 'secondary'} px-3 py-2`}>
                                            {getRoleName(acc.roleID)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Create User */}
            <div
                className={`modal fade ${showModal ? 'show' : ''}`}
                style={{ display: showModal ? 'block' : 'none' }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Tạo tài khoản mới</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowModal(false)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <Formik
                                initialValues={{ email: '', password: '', accountName: '', roleID: '' }}
                                validationSchema={CreateSchema}
                                onSubmit={handleCreate}
                            >
                                {({ isSubmitting }) => (
                                    <Form>
                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label">Email</label>
                                            <Field
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                placeholder="Nhập email"
                                            />
                                            <ErrorMessage name="email" component="div" className="text-danger mt-1 small" />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="password" className="form-label">Mật khẩu</label>
                                            <Field
                                                type="password"
                                                name="password"
                                                className="form-control"
                                                placeholder="Nhập mật khẩu"
                                            />
                                            <ErrorMessage name="password" component="div" className="text-danger mt-1 small" />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="accountName" className="form-label">Tên tài khoản</label>
                                            <Field
                                                type="text"
                                                name="accountName"
                                                className="form-control"
                                                placeholder="Nhập tên"
                                            />
                                            <ErrorMessage name="accountName" component="div" className="text-danger mt-1 small" />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="roleID" className="form-label">Vai trò</label>
                                            <Field as="select" name="roleID" className="form-select">
                                                <option value="">Chọn vai trò</option>
                                                {roles.map((r) => (
                                                    <option key={r.roleID} value={r.roleID}>
                                                        {r.roleName}
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage name="roleID" component="div" className="text-danger mt-1 small" />
                                        </div>

                                        <div className="d-flex justify-content-end gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowModal(false)}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                                            </button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop cho modal */}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default AdminUsers;
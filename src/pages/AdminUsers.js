// File: src/pages/AdminUsers.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getAllAccounts, createAccount, getRoles } from '../services/AccountService';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';

const CreateSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().min(8, 'Too short').required('Required'),
    accountName: Yup.string().required('Required'),
    roleID: Yup.number().required('Required'),
});

const AdminUsers = () => {
    const user = useSelector((state) => state.user);
    const { enqueueSnackbar } = useSnackbar();
    const [accounts, setAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        getAllAccounts(setAccounts);
        getRoles(setRoles);
    }, []);

    const handleCreate = (values) => {
        createAccount(values, {
            success: () => {
                enqueueSnackbar('Created', { variant: 'success' });
                setOpen(false);
                getAllAccounts(setAccounts);
            },
            error: (msg) => enqueueSnackbar(msg, { variant: 'error' }),
        });
    };

    if (user.roleID !== 2) return <div>Unauthorized</div>;

    return (
        <div className="container mt-5">
            <h2>Quản lý User</h2>
            <button className="btn btn-primary mb-3" onClick={() => setOpen(true)}>Tạo User</button>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Tên</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(a => (
                        <tr key={a.accountID}>
                            <td>{a.accountID}</td>
                            <td>{a.email}</td>
                            <td>{a.accountName}</td>
                            <td>{a.roleID}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {open && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', border: '1px solid black', zIndex: 1000 }}>
                    <Formik initialValues={{ email: '', password: '', accountName: '', roleID: '' }} validationSchema={CreateSchema} onSubmit={handleCreate}>
                        <Form>
                            <Field type="email" name="email" className="form-control mb-3" placeholder="Email" />
                            <ErrorMessage name="email" component="div" className="text-danger" />
                            <Field type="password" name="password" className="form-control mb-3" placeholder="Password" />
                            <ErrorMessage name="password" component="div" className="text-danger" />
                            <Field type="text" name="accountName" className="form-control mb-3" placeholder="Tên" />
                            <ErrorMessage name="accountName" component="div" className="text-danger" />
                            <Field as="select" name="roleID" className="form-control mb-3">
                                <option value="">Chọn role</option>
                                {roles.map(r => <option key={r.roleID} value={r.roleID}>{r.roleName}</option>)}
                            </Field>
                            <ErrorMessage name="roleID" component="div" className="text-danger" />
                            <button type="submit" className="btn btn-primary">Tạo</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Hủy</button>
                        </Form>
                    </Formik>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
// File: src/pages/Login.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { login } from '../services/AccountService';
import { useNavigate, Link } from 'react-router-dom';
import socket from '../services/SocketService';
import { useSnackbar } from 'notistack';

const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().required('Required'),
});

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.user);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        console.log('Checking stored session');
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
            socket.emit('auth', sessionId);
            socket.on('authSuccess', (user, sessionId) => {
                console.log('Auth success', user);
                dispatch({ type: 'LOGIN', payload: { user, sessionId } });
                localStorage.setItem('sessionId', sessionId);
                localStorage.setItem('user', JSON.stringify(user));
                navigate('/dashboard');
            });
            socket.on('authError', (msg) => {
                console.log('Auth error', msg);
                localStorage.removeItem('sessionId');
                localStorage.removeItem('user');
                enqueueSnackbar(msg, { variant: 'error' });
            });
        }
        if (user) navigate('/dashboard');
    }, [user, navigate, enqueueSnackbar]);

    return (
        <div className="container mt-5">
            <h2>Đăng nhập</h2>
            <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={LoginSchema}
                onSubmit={(values) => {
                    console.log('Logging in with', values);
                    login({ email: values.email, password: values.password }, {
                        success: (user, sessionId) => {
                            console.log('Login success', user);
                            dispatch({ type: 'LOGIN', payload: { user, sessionId } });
                            localStorage.setItem('sessionId', sessionId);
                            localStorage.setItem('user', JSON.stringify(user));
                            navigate('/dashboard');
                        },
                        error: (msg) => {
                            console.log('Login error', msg);
                            enqueueSnackbar(msg, { variant: 'error' });
                        },
                    });
                }}
            >
                <Form>
                    <div className="form-group">
                        <Field type="email" name="email" className="form-control" placeholder="Email" />
                        <ErrorMessage name="email" component="div" className="text-danger" />
                    </div>
                    <div className="form-group">
                        <Field type="password" name="password" className="form-control" placeholder="Password" />
                        <ErrorMessage name="password" component="div" className="text-danger" />
                    </div>
                    <button type="submit" className="btn btn-primary">Đăng nhập</button>
                </Form>
            </Formik>
            <p>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
        </div>
    );
};

export default Login;
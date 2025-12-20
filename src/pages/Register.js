// File: src/pages/Register.js
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { register } from '../services/AccountService';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const RegisterSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string().min(8, 'Too short').required('Required'),
    accountName: Yup.string().required('Required'),
});

const Register = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    return (
        <div className="container mt-5">
            <h2>Đăng ký</h2>
            <Formik
                initialValues={{ email: '', password: '', accountName: '' }}
                validationSchema={RegisterSchema}
                onSubmit={(values) => {
                    console.log('Registering with', values);
                    register(values, {
                        success: () => {
                            console.log('Register success');
                            enqueueSnackbar('Đăng ký thành công, hãy đăng nhập', { variant: 'success' });
                            navigate('/login');
                        },
                        error: (msg) => {
                            console.log('Register error', msg);
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
                    <div className="form-group">
                        <Field type="text" name="accountName" className="form-control" placeholder="Tên" />
                        <ErrorMessage name="accountName" component="div" className="text-danger" />
                    </div>
                    <button type="submit" className="btn btn-primary">Đăng ký</button>
                </Form>
            </Formik>
        </div>
    );
};

export default Register;
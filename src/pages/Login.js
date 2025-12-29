// File: src/pages/Login.js
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { login, register } from "../services/AccountService";
import { useSnackbar } from "notistack";
import { ToastContainer, Slide } from "react-toastify";
import { IonIcon } from "@ionic/react";
import {
  keyOutline,
  eyeOffOutline,
  eyeOutline,
  mailOutline,
  personOutline,
} from "ionicons/icons";

import "./Login.scss";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().required("Required"),
});

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(8, "Too short").required("Required"),
  accountName: Yup.string().required("Required"),
});

const LoginForm = ({ toggle }) => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [isTogglePassword, setIsTogglePassword] = useState(false);

  const handleTogglePassword = () => {
    setIsTogglePassword(!isTogglePassword);
  };

  return (
    <>
      <h1 className="text-login">ĐĂNG NHẬP</h1>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={async (values) => {
          // Thêm async ở đây
          console.log("Logging in with", values);
          await login(
            // Await login
            { email: values.email, password: values.password },
            {
              success: (user, sessionId) => {
                console.log("Login success", user);
                dispatch({ type: "LOGIN", payload: { user, sessionId } });
                window.location.href = "/dashboard"; // Force reload to trigger auth in App.js
              },
              error: (msg) => {
                console.log("Login error", msg);
                enqueueSnackbar(msg, { variant: "error" });
              },
            }
          );
        }}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="inputbox-login">
              <IonIcon icon={mailOutline} />
              <Field type="email" name="email" placeholder="" />
              <label>Email</label>
              {errors.email && touched.email ? (
                <div className="text-danger">{errors.email}</div>
              ) : null}
            </div>
            <div className="inputbox-login">
              <div
                className="toggle-password-login"
                onClick={handleTogglePassword}
              >
                <IonIcon icon={isTogglePassword ? eyeOutline : eyeOffOutline} />
              </div>
              <IonIcon icon={keyOutline} />
              <Field
                type={isTogglePassword ? "text" : "password"}
                name="password"
                placeholder=""
              />
              <label>Mật khẩu</label>
              {errors.password && touched.password ? (
                <div className="text-danger">{errors.password}</div>
              ) : null}
            </div>
            <button type="submit" className="login-button">
              <p>Đăng nhập</p>
            </button>
          </Form>
        )}
      </Formik>
    </>
  );
};

const RegisterForm = ({ toggle }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isTogglePassword, setIsTogglePassword] = useState(false);

  const handleTogglePassword = () => {
    setIsTogglePassword(!isTogglePassword);
  };

  return (
    <>
      <h1 className="text-register">ĐĂNG KÝ</h1>
      <Formik
        initialValues={{ email: "", password: "", accountName: "" }}
        validationSchema={RegisterSchema}
        onSubmit={async (values) => {
          // Thêm async ở đây
          console.log("Registering with", values);
          await register(values, {
            // Await register
            success: () => {
              console.log("Register success");
              enqueueSnackbar("Đăng ký thành công, hãy đăng nhập", {
                variant: "success",
              });
              window.location.href = "/login"; // Force reload
            },
            error: (msg) => {
              console.log("Register error", msg);
              enqueueSnackbar(msg, { variant: "error" });
            },
          });
        }}
      >
        {({ errors, touched }) => (
          <Form>
            <div className="single">
              <div className="inputbox-login">
                <IonIcon icon={mailOutline} />
                <Field type="email" name="email" placeholder="" />
                <label>Email</label>
                {errors.email && touched.email ? (
                  <div className="text-danger">{errors.email}</div>
                ) : null}
              </div>
            </div>
            <div className="R1">
              <div className="inputbox-login">
                <IonIcon icon={personOutline} />
                <Field type="text" name="accountName" placeholder="" />
                <label>Tên tài khoản</label>
                {errors.accountName && touched.accountName ? (
                  <div className="text-danger">{errors.accountName}</div>
                ) : null}
              </div>
              <div className="inputbox-login">
                <div
                  className="toggle-password-login"
                  onClick={handleTogglePassword}
                >
                  <IonIcon
                    icon={isTogglePassword ? eyeOutline : eyeOffOutline}
                  />
                </div>
                <IonIcon icon={keyOutline} />
                <Field
                  type={isTogglePassword ? "text" : "password"}
                  name="password"
                  placeholder=""
                />
                <label>Mật khẩu</label>
                {errors.password && touched.password ? (
                  <div className="text-danger">{errors.password}</div>
                ) : null}
              </div>
            </div>
            <button type="submit" className="register-button">
              <p>Đăng ký</p>
            </button>
          </Form>
        )}
      </Formik>
    </>
  );
};

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const toggle = () => setIsSignUp(!isSignUp);
  const { enqueueSnackbar } = useSnackbar(); // Xóa useDispatch nếu không dùng

  useEffect(() => {
    // Không cần emit 'auth' ở đây nữa, đã có ở App.js
    // Chỉ connect nếu cần, nhưng App.js đã xử lý
  }, [enqueueSnackbar]);

  return (
    <div className="auth-background">
      <ToastContainer
        autoClose={500}
        newestOnTop={true}
        closeOnClick={false}
        pauseOnFocusLoss={false}
        draggable={true}
        transition={Slide}
        limit={1}
      />
      <div
        className={`login-container ${isSignUp ? "right-panel-active" : ""}`}
      >
        <div className="login-form-container sign-up-container">
          <RegisterForm toggle={toggle} />
        </div>
        <div className="login-form-container sign-in-container">
          <LoginForm toggle={toggle} />
        </div>
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Chào mừng trở lại!</h1>
              <p>
                Để tiếp tục, vui lòng đăng nhập bằng thông tin cá nhân của bạn
              </p>
              <button className="ghost" onClick={toggle}>
                Đăng nhập
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Xin chào!</h1>
              <p>Hãy tạo tài khoản để nhận ưu đãi và thông báo khuyến mãi!</p>
              <button className="ghost" onClick={toggle}>
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

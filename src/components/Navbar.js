// src/components/Navbar/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { logout } from "../services/AccountService";
import { getMyNotifications, clearAllNotifications } from "../services/NotificationService";
import socket from "../services/SocketService";

import styles from "./Navbar.scss"; // Giữ nguyên tên file

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const notifications = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      getMyNotifications((notis) =>
        dispatch({ type: "UPDATE_NOTIFICATIONS", payload: notis })
      );
      socket.on("newNotification", (noti) => {
        dispatch({ type: "ADD_NOTIFICATION", payload: noti });
        console.log("New notification:", noti);
      });
      return () => socket.off("newNotification");
    }
  }, [user, dispatch]);

  const handleLogout = () => {
    logout();
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    localStorage.removeItem("sessionId");
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

const handleClearAllNotifications = () => {
  if (!user || !user.accountID || user.roleID === undefined) {
    return;
  }

  clearAllNotifications(user.accountID, user.roleID, (success) => {
    if (success) {
      dispatch({ type: "CLEAR_NOTIFICATIONS" });
      getMyNotifications((notis) => {
        dispatch({ type: "UPDATE_NOTIFICATIONS", payload: notis });
      });
      setShowNotifications(false);
    }
  });
};

  if (!user) return null;

  return (
    <header className="shadow-sm bg-white">
      <nav className="navbar navbar-expand-lg navbar-light px-3 px-md-4 py-2">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold text-primary" to="/dashboard">
            Support Center
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">
                  Dashboard
                </Link>
              </li>

              {user.roleID === 1 && (
                <li className="nav-item">
                  <Link className="nav-link" to="/tickets/create">
                    Tạo Ticket
                  </Link>
                </li>
              )}

              <li className="nav-item">
                <Link
                  className="nav-link"
                  to={user.roleID === 1 ? "/tickets/my" : "/tickets/staff"}
                >
                  Tickets
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/history">
                  Lịch sử
                </Link>
              </li>

              {user.roleID === 2 && (
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/users">
                    Quản lý User
                  </Link>
                </li>
              )}
            </ul>

            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item position-relative">
                <button
                  className={`nav-link btn btn-link d-flex align-items-center gap-1 ${styles.notificationBtn}`}
                  onClick={toggleNotifications}
                  type="button"
                >
                  <i className="bi bi-bell fs-5"></i>
                  {notifications.length > 0 && (
                    <span className="badge bg-danger rounded-pill">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className={`dropdown-menu dropdown-menu-end show shadow ${styles.dropdownMenu}`}
                    style={{ marginLeft: '-230px' }}
                  >
                    <div className="dropdown-header bg-light border-bottom d-flex justify-content-between align-items-center">
                      <strong>Thông báo</strong>
                      {notifications.length > 0 && (
                        <button
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={handleClearAllNotifications}
                        >
                          Xóa hết
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className={`dropdown-item text-muted text-center py-4 ${styles.emptyMessage}`}>
                        Không có thông báo mới
                      </div>
                    ) : (
                      notifications.map((noti, idx) => (
                        <div
                          key={idx}
                          className={`dropdown-item border-bottom py-3 ${styles.notificationItem}`}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>{noti.notificationDescription}</div>
                            <small className="text-muted ms-3">
                              {new Date(noti.createdAt).toLocaleString("vi-VN")}
                            </small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </li>

              <li className="nav-item">
                <button
                  className={`btn btn-outline-secondary ms-3 ${styles.logoutBtn}`}
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
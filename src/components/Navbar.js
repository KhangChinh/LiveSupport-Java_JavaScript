// src/components/Navbar/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Thêm useLocation
import { logout } from "../services/AccountService";
import { getMyNotifications, clearAllNotifications } from "../services/NotificationService";
import socket from "../services/SocketService";

import styles from "./Navbar.module.scss"; // Đổi tên file SCSS thành module cho scoped styles

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const notifications = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();// Để kiểm tra trang hiện tại
  const [showNotifications, setShowNotifications] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  useEffect(() => {
    if (user) {
      getMyNotifications((notis) =>
        dispatch({ type: "UPDATE_NOTIFICATIONS", payload: notis })
      );
      socket.on("newNotification", (noti) => {
        dispatch({ type: "ADD_NOTIFICATION", payload: noti });
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

  const getLinkClass = (targetPath) => {
    const isCurrent = location.pathname === targetPath;

    // Nếu đang hover bất kỳ link nào, thì KHÔNG áp dụng active thật cho link hiện tại
    if (isCurrent && !isHovering) {
      return styles.active;
    }

    // Nếu đang hover chính link này → áp dụng hoverActive
    // (ở đây ta sẽ xử lý hoverActive qua onMouseEnter/Leave riêng)
    return "";
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
    <header className={styles.header}>
      <nav className={`navbar navbar-expand-lg ${styles.navbar}`}>
        <div className="container-fluid">
          <Link className={styles.brand} to="/dashboard">
            <div className={styles.logoContainer}>
              <span className={styles.website}>Website:</span>
              <span className={styles.title}>Hỗ trợ khách hàng</span>
            </div>
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
                <div
                  className={`${styles.navLink} ${getLinkClass("/dashboard")}`}
                  onClick={() => navigate("/dashboard")}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  Home
                </div>
              </li>

              {user.roleID === 1 && (
                <li className="nav-item">
                  <div
                    className={`${styles.navLink} ${getLinkClass("/tickets/create")}`}
                    onClick={() => navigate("/tickets/create")}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    Tạo Ticket
                  </div>
                </li>
              )}

              <li className="nav-item">
                <div
                  className={`${styles.navLink} ${getLinkClass(
                    user.roleID === 1 ? "/tickets/my" : "/tickets/staff"
                  )}`}
                  onClick={() =>
                    navigate(user.roleID === 1 ? "/tickets/my" : "/tickets/staff")
                  }
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  Tickets
                </div>
              </li>

              <li className="nav-item">
                <div
                  className={`${styles.navLink} ${getLinkClass("/history")}`}
                  onClick={() => navigate("/history")}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  Lịch sử
                </div>
              </li>

              {user.roleID === 2 && (
                <li className="nav-item">
                  <div
                    className={`${styles.navLink} ${getLinkClass("/admin/users")}`}
                    onClick={() => navigate("/admin/users")}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    Quản lý User
                  </div>
                </li>
              )}
            </ul>

            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item position-relative">
                <button
                  className={`btn btn-link ${styles.notificationBtn}`}
                  onClick={toggleNotifications}
                  type="button"
                >
                  <i className="bi bi-bell fs-5"></i>
                  {notifications.length > 0 && (
                    <span className="badge bg-danger rounded-pill"
                      style={{ position: 'absolute', top: '0px', right: '-5px', fontSize: '0.7rem' }}>
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className={`dropdown-menu dropdown-menu-end show shadow ${styles.dropdownMenu}`}
                    style={{ marginLeft: '-250px', width: '430px' }}>
                    <div className={`dropdown-header ${styles.dropdownHeader}`}>
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
                          <div className="d-flex justify-content-between align-items-start"
                            style={{ height: '40px' }}>
                            {/* Phần nội dung chính (mô tả) */}
                            <div className="pe-5"> {/* pe-5 để chừa chỗ nếu mô tả dài */}
                              {noti.notificationDescription}
                            </div>
                          </div>

                          {/* Thời gian đặt ở góc phải dưới */}
                          <small
                            className="text-muted position-absolute bottom-0 end-0 me-3 mb-2"
                          >
                            {new Date(noti.createdAt).toLocaleString("vi-VN")}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </li>

              <li className="nav-item">
                <div className={`${styles.logoutBtn}`} onClick={handleLogout}>
                  Đăng xuất
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
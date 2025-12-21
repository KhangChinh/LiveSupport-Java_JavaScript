// File: src/App.js
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import socket from "./services/SocketService";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateTicket from "./pages/CreateTicket";
import TicketList from "./pages/TicketList";
import StaffTicketList from "./pages/StaffTicketList";
import ChatRoom from "./pages/ChatRoom";
import History from "./pages/History";
import AdminUsers from "./pages/AdminUsers";
import Navbar from "./components/Navbar";

const App = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect(); // Connect nếu chưa
    }

    // Clear old auth listeners to avoid duplicates
    socket.off("authSuccess");
    socket.off("authError");

    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) {
      socket.emit("auth", sessionId);
      socket.on("authSuccess", (user, sessionId) => {
        console.log("Auth success", user);
        dispatch({ type: "LOGIN", payload: { user, sessionId } });
        localStorage.setItem("sessionId", sessionId);
        localStorage.setItem("user", JSON.stringify(user));
      });
      socket.on("authError", (msg) => {
        console.log("Auth error", msg);
        dispatch({ type: "LOGOUT" });
      });
    }

    socket.on("logoutSuccess", () => {
      dispatch({ type: "LOGOUT" });
      window.location.href = "/login"; // Force redirect
    });

    return () => {
      socket.off("authSuccess");
      socket.off("authError");
      socket.off("logoutSuccess");
    };
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/tickets/create"
          element={
            user && user.roleID === 1 ? (
              <CreateTicket />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/tickets/my"
          element={
            user && user.roleID === 1 ? (
              <TicketList />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/tickets/staff"
          element={
            user && [2, 3].includes(user.roleID) ? (
              <StaffTicketList />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/chat/:roomId"
          element={user ? <ChatRoom /> : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={user ? <History /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/users"
          element={
            user && user.roleID === 2 ? (
              <AdminUsers />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </Router>
  );
};

export default App;

// File: src/services/AccountService.js
import socket from "./SocketService";

const ensureConnected = () => {
  if (socket.connected) return Promise.resolve();
  socket.connect();
  return new Promise((resolve) => socket.once("connect", resolve));
};

export const register = async (data, callback) => {
  await ensureConnected();
  socket.off("registerSuccess");
  socket.off("registerError");
  socket.emit("register", data);
  socket.once("registerSuccess", callback.success);
  socket.once("registerError", callback.error);
};

export const login = async (data, callback) => {
  await ensureConnected();
  socket.off("loginSuccess");
  socket.off("loginError");
  socket.emit("login", data);
  socket.once("loginSuccess", callback.success);
  socket.once("loginError", callback.error);
};

export const logout = () => {
  const sessionId = localStorage.getItem("sessionId");
  if (sessionId) {
    socket.emit("logout", sessionId);
    socket.disconnect();
    localStorage.removeItem("sessionId");
    localStorage.removeItem("user");
  }
};

export const createAccount = (data, callback) => {
  socket.emit("createAccount", data);
  socket.once("createAccountSuccess", callback.success);
  socket.once("createAccountError", callback.error);
};

export const getRoles = (callback) => {
  socket.emit("getRoles");
  socket.once("roles", callback);
};

export const getStaffByRole = (data, callback) => {
  socket.emit("getStaffByRole", data);
  socket.once("staffByRole", callback);
};

export const getTransferStaff = (data, callback) => {
  socket.emit("getTransferStaff", data);
  socket.once("transferStaff", callback);
};

export const getAllAccounts = (callback) => {
  socket.emit("getAllAccounts");
  socket.once("allAccounts", callback);
};

// File: src/services/AccountService.js
import socket from './SocketService';

export const register = (data, callback) => {
    socket.emit('register', data);
    socket.once('registerSuccess', callback.success);
    socket.once('registerError', callback.error);
};

export const login = (data, callback) => {
    socket.emit('login', data);
    socket.once('loginSuccess', callback.success);
    socket.once('loginError', callback.error);
};

export const logout = (sessionId) => {
    socket.emit('logout', sessionId);
};

export const createAccount = (data, callback) => {
    socket.emit('createAccount', data);
    socket.once('createAccountSuccess', callback.success);
    socket.once('createAccountError', callback.error);
};

export const getRoles = (callback) => {
    socket.emit('getRoles');
    socket.once('roles', callback);
};

export const getStaffByRole = (data, callback) => {
    socket.emit('getStaffByRole', data);
    socket.once('staffByRole', callback);
};

export const getTransferStaff = (data, callback) => {
    socket.emit('getTransferStaff', data);
    socket.once('transferStaff', callback);
};

export const getAllAccounts = (callback) => {
    socket.emit('getAllAccounts');
    socket.once('allAccounts', callback);
};
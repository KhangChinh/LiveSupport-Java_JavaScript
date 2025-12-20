// File: src/services/MessageService.js
import socket from './SocketService';

export const sendMessage = (data) => {
    socket.emit('sendMessage', data);
};

export const sendFile = (data) => {
    socket.emit('sendFile', data);
};

export const loadHistory = (data, callback) => {
    socket.emit('loadHistory', data);
    socket.once('historyMessages', callback);
};

export const joinRoom = (data, callback) => {
    socket.emit('joinRoom', data);
    socket.once('joinRoomSuccess', callback.success);
    socket.once('joinRoomError', callback.error);
};
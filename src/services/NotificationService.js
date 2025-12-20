// File: src/services/NotificationService.js
import socket from './SocketService';

export const getMyNotifications = (callback) => {
    socket.emit('getMyNotifications');
    socket.once('myNotifications', callback);
};
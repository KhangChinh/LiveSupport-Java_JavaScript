// File: src/services/NotificationService.js
import socket from './SocketService';

export const getMyNotifications = (callback) => {
    socket.emit('getMyNotifications');
    socket.once('myNotifications', callback);
};

export const clearAllNotifications = (accountID, roleID, callback) => {
    socket.emit('clearAllNotifications', { accountID, roleID });
    socket.once('notificationsCleared', callback);
};
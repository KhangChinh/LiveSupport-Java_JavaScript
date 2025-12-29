// File: src/services/MessageService.js
import socket from './SocketService';

export const sendMessage = (data) => {
    socket.emit('sendMessage', data);
};

export const sendFile = (data, callbacks = {}) => {
  socket.emit('sendFile', data, (response) => {
    if (response && response.success) {
      if (typeof callbacks.success === 'function') {
        callbacks.success(response.message);
      }
    } else {
      if (typeof callbacks.error === 'function') {
        callbacks.error(response?.error || 'Failed to send file');
      }
    }
  });
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
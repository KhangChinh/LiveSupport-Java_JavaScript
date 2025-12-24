// File: src/services/RoomService.js
import socket from './SocketService';

export const joinRoom = (data, callback) => {
    socket.emit('joinRoom', data);
    socket.once('joinRoomSuccess', callback.success);
    socket.once('joinRoomError', callback.error);
};

export const renameRoom = (data, callback) => {
    socket.emit('renameRoom', data);
    socket.once('renameRoomSuccess', callback.success);
    socket.once('renameRoomError', callback.error);
};

export const getMyRooms = (data, callback) => {
    socket.emit('getMyRooms', data);
    socket.once('myRooms', callback);
};

export const getMyRoomsCount = (data, callback) => {
    socket.emit('getMyRoomsCount', data);
    socket.once('myRoomsCount', callback);
};

export const getRoomById = (data, callback) => {
    socket.emit('getRoomById', data);
    socket.once('roomInfo', (room) => {
        callback.success(room);
    });
    socket.once('getRoomError', (errorMsg) => {
        callback.error(errorMsg);
    });
};
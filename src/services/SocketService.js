// File: src/services/SocketService.js
import io from 'socket.io-client';
import store from '../redux/store';

const socket = io(process.env.REACT_APP_SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
});

let isAuthenticated = false;

socket.on('connect', () => {
    console.log('Socket connected');
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId && !isAuthenticated) {
        console.log('Auto-authenticating with stored session');
        store.dispatch({ type: 'AUTH_START' });
        socket.emit('auth', sessionId);
    }
});

socket.on('disconnect', () => {
    console.log('Socket disconnected');
    isAuthenticated = false; 
});

socket.on('authSuccess', (user, sessionId) => {
    console.log('Auth success', user);
    isAuthenticated = true;
    store.dispatch({ type: 'LOGIN', payload: { user, sessionId } });
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('user', JSON.stringify(user));
});

socket.on('authError', (msg) => {
    console.log('Auth error', msg);
    isAuthenticated = false;
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    store.dispatch({ type: 'LOGOUT' });
});

export default socket;
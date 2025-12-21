// File: src/services/SocketService.js
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
  console.log("Socket connected");
});
socket.on("reconnect", (attempt) => {
  console.log("Socket reconnected after attempt:", attempt);
});
socket.on("disconnect", () => {
  console.log("Socket disconnected");
});
socket.on("logoutSuccess", () => {
  localStorage.removeItem("sessionId");
  localStorage.removeItem("user");
  // dispatch LOGOUT if needed
});

export default socket;

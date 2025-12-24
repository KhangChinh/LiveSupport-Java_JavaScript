// File: src/services/TicketService.js
import socket from "./SocketService";

export const createTicket = (data, callback) => {
  socket.emit("createTicket", {
    description: data.description,
    roleID: data.roleID,
    staffID: data.staffID,
  });
  socket.once("createTicketSuccess", callback.success);
  socket.once("createTicketError", callback.error);
};

export const getMyTickets = (data, callback) => {
  socket.emit("getMyTickets", data);
  socket.once("myTickets", callback);
};

export const getMyTicketsCount = (data, callback) => {
  socket.emit("getMyTicketsCount", data);
  socket.once("myTicketsCount", callback);
};

export const acceptTicket = (data, callback) => {
  socket.emit("acceptTicket", data);
  socket.once("acceptTicketSuccess", callback.success);
  socket.once("acceptTicketError", callback.error);
};

export const rejectTicket = (data, callback) => {
  socket.emit("rejectTicket", data);
  socket.once("rejectTicketSuccess", callback.success);
  socket.once("rejectTicketError", callback.error);
};

export const transferTicket = (data, callback) => {
  socket.emit("transferTicket", data);
  socket.once("transferTicketSuccess", callback.success);
  socket.once("transferTicketError", callback.error);
};

export const endTicket = (data, callback) => {
  socket.emit("endTicket", data);
  socket.once("endTicketSuccess", callback.success);
  socket.once("endTicketError", callback.error);
};

export const getTransferStaff = (data, callback) => {
  socket.emit("getTransferStaff", data);
  socket.once("transferStaff", callback);
};
export const getRatingStats = (callback) => {
  socket.emit("getRatingStats", {}); // Không cần truyền data, server tự lấy từ session
  socket.once("ratingStats", callback.success);
  socket.once("getRatingStatsError", callback.error);
};

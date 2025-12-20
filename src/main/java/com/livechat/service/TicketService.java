package com.livechat.service;

import com.livechat.model.Ticket;
import com.livechat.DatabaseManager;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class TicketService {

    public Ticket createTicket(Ticket ticket) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "INSERT INTO Ticket (TicketDescription, CreatedAt, CustomerID, RoleID, StaffID, TicketStatusID) VALUES (?, ?, ?, ?, ?, ?)";
                PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                pstmt.setString(1, ticket.getTicketDescription());
                pstmt.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
                pstmt.setInt(3, ticket.getCustomerID());
                pstmt.setInt(4, ticket.getRoleID());
                if (ticket.getStaffID() != null) {
                    pstmt.setInt(5, ticket.getStaffID());
                } else {
                    pstmt.setNull(5, java.sql.Types.INTEGER);
                }
                pstmt.setInt(6, 1); // PENDING
                pstmt.executeUpdate();
                ResultSet generatedKeys = pstmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    ticket.setTicketID(generatedKeys.getInt(1));
                }
                return ticket;
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return null;
    }

    public List<Ticket> getMyTickets(int accountID, int roleID, String filterStatus, String search, String sort, int page, int limit) {
        List<Ticket> tickets = new ArrayList<>();
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                StringBuilder sql = new StringBuilder("SELECT t.*, c.AccountName as CustomerName, s.AccountName as StaffName, r.RoomID as roomID FROM Ticket t " +
                        "LEFT JOIN Account c ON t.CustomerID = c.AccountID " +
                        "LEFT JOIN Account s ON t.StaffID = s.AccountID " +
                        "LEFT JOIN Room r ON t.TicketID = r.TicketID WHERE ");
                if (roleID == 1) { // Customer
                    sql.append("t.CustomerID = ?");
                } else { // Staff/Admin
                    sql.append("(t.RoleID = ? AND t.TicketStatusID = 1) OR t.StaffID = ?");
                }
                if (filterStatus != null) {
                    sql.append(" AND t.TicketStatusID = ?");
                }
                if (search != null) {
                    sql.append(" AND (t.TicketDescription LIKE ? OR c.AccountName LIKE ?)");
                }
                sql.append(" ORDER BY ").append(sort != null ? sort : "t.CreatedAt DESC");
                sql.append(" LIMIT ? OFFSET ?");
                PreparedStatement pstmt = conn.prepareStatement(sql.toString());
                int paramIndex = 1;
                if (roleID == 1) {
                    pstmt.setInt(paramIndex++, accountID);
                } else {
                    pstmt.setInt(paramIndex++, roleID);
                    pstmt.setInt(paramIndex++, accountID);
                }
                if (filterStatus != null) {
                    pstmt.setInt(paramIndex++, Integer.parseInt(filterStatus));
                }
                if (search != null) {
                    pstmt.setString(paramIndex++, "%" + search + "%");
                    pstmt.setString(paramIndex++, "%" + search + "%");
                }
                pstmt.setInt(paramIndex++, limit);
                pstmt.setInt(paramIndex, (page - 1) * limit);
                ResultSet rs = pstmt.executeQuery();
                while (rs.next()) {
                    Ticket ticket = new Ticket();
                    ticket.setTicketID(rs.getInt("TicketID"));
                    ticket.setTicketDescription(rs.getString("TicketDescription"));
                    ticket.setCreatedAt(rs.getTimestamp("CreatedAt"));
                    ticket.setEndedAt(rs.getTimestamp("EndedAt"));
                    ticket.setRatingPoint(rs.getInt("RatingPoint"));
                    ticket.setRatingDescription(rs.getString("RatingDescription"));
                    ticket.setCustomerID(rs.getInt("CustomerID"));
                    ticket.setRoleID(rs.getInt("RoleID"));
                    ticket.setStaffID(rs.getInt("StaffID"));
                    ticket.setTicketStatusID(rs.getInt("TicketStatusID"));
                    ticket.setRoomID(rs.getInt("roomID"));
                    tickets.add(ticket);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return tickets;
    }

    public int getTicketCount(int accountID, int roleID, String filterStatus, String search) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM Ticket t " +
                        "LEFT JOIN Account c ON t.CustomerID = c.AccountID WHERE ");
                if (roleID == 1) {
                    sql.append("t.CustomerID = ?");
                } else {
                    sql.append("(t.RoleID = ? AND t.TicketStatusID = 1) OR t.StaffID = ?");
                }
                if (filterStatus != null) {
                    sql.append(" AND t.TicketStatusID = ?");
                }
                if (search != null) {
                    sql.append(" AND (t.TicketDescription LIKE ? OR c.AccountName LIKE ?)");
                }
                PreparedStatement pstmt = conn.prepareStatement(sql.toString());
                int paramIndex = 1;
                if (roleID == 1) {
                    pstmt.setInt(paramIndex++, accountID);
                } else {
                    pstmt.setInt(paramIndex++, roleID);
                    pstmt.setInt(paramIndex++, accountID);
                }
                if (filterStatus != null) {
                    pstmt.setInt(paramIndex++, Integer.parseInt(filterStatus));
                }
                if (search != null) {
                    pstmt.setString(paramIndex++, "%" + search + "%");
                    pstmt.setString(paramIndex++, "%" + search + "%");
                }
                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    return rs.getInt(1);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return 0;
    }

    public boolean acceptTicket(int ticketID, int staffID) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "UPDATE Ticket SET StaffID = ?, TicketStatusID = 2 WHERE TicketID = ? AND TicketStatusID = 1";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, staffID);
                pstmt.setInt(2, ticketID);
                int rows = pstmt.executeUpdate();
                return rows > 0;
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return false;
    }

    public boolean rejectTicket(int ticketID) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "UPDATE Ticket SET TicketStatusID = 3 WHERE TicketID = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, ticketID);
                int rows = pstmt.executeUpdate();
                return rows > 0;
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return false;
    }

    public boolean transferTicket(int ticketID, int newStaffID) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "UPDATE Ticket SET StaffID = ? WHERE TicketID = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, newStaffID);
                pstmt.setInt(2, ticketID);
                int rows = pstmt.executeUpdate();
                return rows > 0;
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return false;
    }

    public boolean endTicket(int ticketID, int ratingPoint, String ratingDescription) {
        if (ratingPoint < 1 || ratingPoint > 5) {
            return false; // Validation
        }
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "UPDATE Ticket SET EndedAt = ?, RatingPoint = ?, RatingDescription = ?, TicketStatusID = 4 WHERE TicketID = ? AND TicketStatusID = 2";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setTimestamp(1, new Timestamp(System.currentTimeMillis()));
                pstmt.setInt(2, ratingPoint);
                pstmt.setString(3, ratingDescription);
                pstmt.setInt(4, ticketID);
                int rows = pstmt.executeUpdate();
                return rows > 0;
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return false;
    }

    public Ticket getTicketById(int ticketID) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "SELECT * FROM Ticket WHERE TicketID = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, ticketID);
                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    Ticket ticket = new Ticket();
                    ticket.setTicketID(rs.getInt("TicketID"));
                    ticket.setTicketDescription(rs.getString("TicketDescription"));
                    ticket.setCreatedAt(rs.getTimestamp("CreatedAt"));
                    ticket.setEndedAt(rs.getTimestamp("EndedAt"));
                    ticket.setRatingPoint(rs.getInt("RatingPoint"));
                    ticket.setRatingDescription(rs.getString("RatingDescription"));
                    ticket.setCustomerID(rs.getInt("CustomerID"));
                    ticket.setRoleID(rs.getInt("RoleID"));
                    ticket.setStaffID(rs.getInt("StaffID"));
                    ticket.setTicketStatusID(rs.getInt("TicketStatusID"));
                    return ticket;
                }
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        return null;
    }
}
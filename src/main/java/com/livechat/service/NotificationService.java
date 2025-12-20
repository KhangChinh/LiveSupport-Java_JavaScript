package com.livechat.service;

import com.livechat.DatabaseManager;
import com.livechat.model.Notification;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class NotificationService {

    public void createNotification(Notification notification) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "INSERT INTO Notification (NotificationDescription, CreatedAt, SendNotificationID, ReceiveNotificationID, RoleReceive) VALUES (?, ?, ?, ?, ?)";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setString(1, notification.getNotificationDescription());
                pstmt.setTimestamp(2, new Timestamp(System.currentTimeMillis()));
                pstmt.setInt(3, notification.getSendNotificationID());
                if (notification.getReceiveNotificationID() != null) {
                    pstmt.setInt(4, notification.getReceiveNotificationID());
                } else {
                    pstmt.setNull(4, java.sql.Types.INTEGER);
                }
                if (notification.getRoleReceive() != null) {
                    pstmt.setInt(5, notification.getRoleReceive());
                } else {
                    pstmt.setNull(5, java.sql.Types.INTEGER);
                }
                pstmt.executeUpdate();
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
    }

    public List<Notification> getMyNotifications(int accountID, int roleID) {
        List<Notification> notifications = new ArrayList<>();
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "SELECT * FROM Notification WHERE ReceiveNotificationID = ? OR RoleReceive = ? ORDER BY CreatedAt DESC LIMIT 50";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, accountID);
                pstmt.setInt(2, roleID);
                ResultSet rs = pstmt.executeQuery();
                while (rs.next()) {
                    Notification noti = new Notification();
                    noti.setNotificationID(rs.getInt("NotificationID"));
                    noti.setNotificationDescription(rs.getString("NotificationDescription"));
                    noti.setCreatedAt(rs.getTimestamp("CreatedAt"));
                    noti.setSendNotificationID(rs.getInt("SendNotificationID"));
                    noti.setReceiveNotificationID(rs.getInt("ReceiveNotificationID"));
                    noti.setRoleReceive(rs.getInt("RoleReceive"));
                    notifications.add(noti);
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
        return notifications;
    }
}
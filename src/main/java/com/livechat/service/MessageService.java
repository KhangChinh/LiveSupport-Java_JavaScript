package com.livechat.service;

import com.livechat.DatabaseManager;
import com.livechat.model.Message;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class MessageService {

    public void saveMessage(Message message) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "INSERT INTO Message (MessageTypeID, MessageText, SentAt, RoomID, SenderID, FileID) VALUES (?, ?, ?, ?, ?, ?)";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, message.getMessageTypeID());
                pstmt.setString(2, message.getMessageText());
                pstmt.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
                pstmt.setInt(4, message.getRoomID());
                pstmt.setInt(5, message.getSenderID());
                if (message.getFileID() != null) {
                    pstmt.setInt(6, message.getFileID());
                } else {
                    pstmt.setNull(6, java.sql.Types.INTEGER);
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

    public List<Message> loadHistory(int roomID) {
        List<Message> history = new ArrayList<>();
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "SELECT m.*, f.FilePath, f.FileName FROM Message m LEFT JOIN File f ON m.FileID = f.FileID WHERE m.RoomID = ? ORDER BY m.SentAt ASC";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, roomID);
                ResultSet rs = pstmt.executeQuery();
                while (rs.next()) {
                    Message msg = new Message();
                    msg.setMessageID(rs.getInt("MessageID"));
                    msg.setMessageTypeID(rs.getInt("MessageTypeID"));
                    msg.setMessageText(rs.getString("MessageText"));
                    msg.setSentAt(rs.getTimestamp("SentAt"));
                    msg.setRoomID(rs.getInt("RoomID"));
                    msg.setSenderID(rs.getInt("SenderID"));
                    msg.setFileID(rs.getInt("FileID"));
                    msg.setFilePath(rs.getString("FilePath"));
                    msg.setFileName(rs.getString("FileName"));
                    history.add(msg);
                }
                System.out.println("Loaded " + history.size() + " messages for room " + roomID);
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
        return history;
    }
}
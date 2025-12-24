package com.livechat.service;

import com.livechat.DatabaseManager;
import com.livechat.model.FileModel;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class FileService {

    public int saveFile(FileModel file) {
        Connection conn = DatabaseManager.getConnection();
        if (conn != null) {
            try {
                String sql = "INSERT INTO File (FilePath, FileName, FileTypeID, AccountID) VALUES (?, ?, ?, ?)";
                PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                pstmt.setString(1, file.getFilePath());
                pstmt.setString(2, file.getFileName());
                pstmt.setInt(3, file.getFileTypeID());
                pstmt.setInt(4, file.getAccountID());
                pstmt.executeUpdate();
                ResultSet generatedKeys = pstmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    return generatedKeys.getInt(1);
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
        return -1;
    }

    public int getFileTypeIDByCode(String code) {
    Connection conn = DatabaseManager.getConnection();
    if (conn != null) {
        try {
            String sql = "SELECT FileTypeID FROM FileType WHERE FileTypeCode = ?";
            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, code);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                return rs.getInt("FileTypeID");
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
    return 1; // Default to txt
}
}
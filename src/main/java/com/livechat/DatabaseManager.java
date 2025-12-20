package com.livechat;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DatabaseManager {
    private static String URL;
    private static String USER;
    private static String PASS;

    public static void init(Properties props) {
        URL = props.getProperty("db.url");
        USER = props.getProperty("db.user");
        PASS = props.getProperty("db.pass");
    }

    public static Connection getConnection() {
        try {
            return DriverManager.getConnection(URL, USER, PASS);
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }
}
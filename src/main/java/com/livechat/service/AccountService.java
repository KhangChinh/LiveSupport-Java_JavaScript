package com.livechat.service;

import com.livechat.DatabaseManager;
import com.livechat.model.Account;
import com.livechat.model.Role;
import com.livechat.util.BcryptUtil;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
    import java.sql.Statement;
    import java.util.ArrayList;
    import java.util.List;

    public class AccountService {

        public Account register(Account account) {
            if (account.getEmail() == null || account.getPassword() == null || account.getAccountName() == null) {
                return null;
            }
            Connection conn = DatabaseManager.getConnection();
            if (conn != null) {
                try {
                    // Check unique email
                    String checkSql = "SELECT * FROM Account WHERE Email = ?";
                    PreparedStatement checkPstmt = conn.prepareStatement(checkSql);
                    checkPstmt.setString(1, account.getEmail());
                    ResultSet rs = checkPstmt.executeQuery();
                    if (rs.next()) {
                        return null; // Email exists
                    }

                    String sql = "INSERT INTO Account (Email, Password, AccountName, RoleID) VALUES (?, ?, ?, ?)";
                    PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                    pstmt.setString(1, account.getEmail());
                    pstmt.setString(2, BcryptUtil.hashPassword(account.getPassword()));
                    pstmt.setString(3, account.getAccountName());
                    pstmt.setInt(4, 1); // Role C
                    pstmt.executeUpdate();
                    ResultSet generatedKeys = pstmt.getGeneratedKeys();
                    if (generatedKeys.next()) {
                        account.setAccountID(generatedKeys.getInt(1));
                    }
                    return account;
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

        public Account login(String email, String password) {
            Connection conn = DatabaseManager.getConnection();
            if (conn != null) {
                try {
                    String sql = "SELECT * FROM Account WHERE Email = ?";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    pstmt.setString(1, email);
                    ResultSet rs = pstmt.executeQuery();
                    if (rs.next()) {
                        String hashed = rs.getString("Password");
                        if (BcryptUtil.checkPassword(password, hashed)) {
                            Account account = new Account();
                            account.setAccountID(rs.getInt("AccountID"));
                            account.setEmail(rs.getString("Email"));
                            account.setAccountName(rs.getString("AccountName"));
                            account.setRoleID(rs.getInt("RoleID"));
                            return account;
                        }
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

        public Account createAccount(Account account) {
            if (account.getEmail() == null || account.getPassword() == null || account.getAccountName() == null || account.getRoleID() == 0) {
                return null;
            }
            Connection conn = DatabaseManager.getConnection();
            if (conn != null) {
                try {
                    String sql = "INSERT INTO Account (Email, Password, AccountName, RoleID) VALUES (?, ?, ?, ?)";
                    PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                    pstmt.setString(1, account.getEmail());
                    pstmt.setString(2, BcryptUtil.hashPassword(account.getPassword()));
                    pstmt.setString(3, account.getAccountName());
                    pstmt.setInt(4, account.getRoleID());
                    pstmt.executeUpdate();
                    ResultSet generatedKeys = pstmt.getGeneratedKeys();
                    if (generatedKeys.next()) {
                        account.setAccountID(generatedKeys.getInt(1));
                    }
                    return account;
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

        public List<Account> getStaffByRole(int roleID, String searchQuery) {
            List<Account> staff = new ArrayList<>();
            Connection conn = DatabaseManager.getConnection();
            if (conn != null) {
                try {
                    String sql = "SELECT * FROM Account WHERE RoleID = ? AND AccountName LIKE ? LIMIT 20";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    pstmt.setInt(1, roleID);
                    pstmt.setString(2, "%" + (searchQuery != null ? searchQuery : "") + "%");
                    ResultSet rs = pstmt.executeQuery();
                    while (rs.next()) {
                        Account account = new Account();
                        account.setAccountID(rs.getInt("AccountID"));
                        account.setAccountName(rs.getString("AccountName"));
                        account.setRoleID(rs.getInt("RoleID"));
                        staff.add(account);
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
            return staff;
        }

        public List<Account> getTransferStaff(String searchQuery, int currentRoleID) {
            List<Account> staff = new ArrayList<>();
            Connection conn = DatabaseManager.getConnection();
            if (conn != null) {
                try {
                    String sql = "SELECT * FROM Account WHERE RoleID != 1 AND AccountName LIKE ? LIMIT 20";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    pstmt.setString(1, "%" + (searchQuery != null ? searchQuery : "") + "%");
                    ResultSet rs = pstmt.executeQuery();
                    while (rs.next()) {
                        Account account = new Account();
                        account.setAccountID(rs.getInt("AccountID"));
                        account.setAccountName(rs.getString("AccountName"));
                        account.setRoleID(rs.getInt("RoleID"));
                        staff.add(account);
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
            return staff;
        }

        public List<Role> getRoles() {
            List<Role> roles = new ArrayList<>();
            Connection conn = DatabaseManager.getConnection();
            if (conn != null) {
                try {
                    String sql = "SELECT * FROM Role";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    ResultSet rs = pstmt.executeQuery();
                    while (rs.next()) {
                        Role role = new Role();
                        role.setRoleID(rs.getInt("RoleID"));
                        role.setRoleCode(rs.getString("RoleCode"));
                        role.setRoleName(rs.getString("RoleName"));
                        roles.add(role);
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
            return roles;
        }

        public List<Account> getAllAccounts() {
            List<Account> accounts = new ArrayList<>();
            Connection conn = DatabaseManager.getConnection();
            if (conn != null) {
                try {
                    String sql = "SELECT * FROM Account ORDER BY AccountID DESC";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    ResultSet rs = pstmt.executeQuery();
                    while (rs.next()) {
                        Account account = new Account();
                        account.setAccountID(rs.getInt("AccountID"));
                        account.setEmail(rs.getString("Email"));
                        account.setAccountName(rs.getString("AccountName"));
                        account.setRoleID(rs.getInt("RoleID"));
                        accounts.add(account);
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
            return accounts;
        }
    }
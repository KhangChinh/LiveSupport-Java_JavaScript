// File: src/main/java/com/livechat/model/Account.java
package com.livechat.model;

public class Account {
    private int accountID;
    private String email;
    private String password;
    private String accountName;
    private Integer accountImage;
    private int roleID;

    // Getters and Setters
    public int getAccountID() {
        return accountID;
    }

    public void setAccountID(int accountID) {
        this.accountID = accountID;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public Integer getAccountImage() {
        return accountImage;
    }

    public void setAccountImage(Integer accountImage) {
        this.accountImage = accountImage;
    }

    public int getRoleID() {
        return roleID;
    }

    public void setRoleID(int roleID) {
        this.roleID = roleID;
    }
}
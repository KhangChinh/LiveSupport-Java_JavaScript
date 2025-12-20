package com.livechat.model;

import java.sql.Timestamp;

public class Notification {
    private int notificationID;
    private String notificationDescription;
    private Timestamp createdAt;
    private int sendNotificationID;
    private Integer receiveNotificationID;
    private Integer roleReceive;

    // Getters and Setters
    public int getNotificationID() {
        return notificationID;
    }

    public void setNotificationID(int notificationID) {
        this.notificationID = notificationID;
    }

    public String getNotificationDescription() {
        return notificationDescription;
    }

    public void setNotificationDescription(String notificationDescription) {
        this.notificationDescription = notificationDescription;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public int getSendNotificationID() {
        return sendNotificationID;
    }

    public void setSendNotificationID(int sendNotificationID) {
        this.sendNotificationID = sendNotificationID;
    }

    public Integer getReceiveNotificationID() {
        return receiveNotificationID;
    }

    public void setReceiveNotificationID(Integer receiveNotificationID) {
        this.receiveNotificationID = receiveNotificationID;
    }

    public Integer getRoleReceive() {
        return roleReceive;
    }

    public void setRoleReceive(Integer roleReceive) {
        this.roleReceive = roleReceive;
    }
}
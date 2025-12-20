package com.livechat.model;

import java.sql.Timestamp;

public class Ticket {
    private int ticketID;
    private String ticketDescription;
    private Timestamp createdAt;
    private Timestamp endedAt;
    private Integer ratingPoint;
    private String ratingDescription;
    private int customerID;
    private int roleID;
    private Integer staffID;
    private int ticketStatusID;
    private Integer roomID;

    public int getTicketID() {
        return ticketID;
    }

    public void setTicketID(int ticketID) {
        this.ticketID = ticketID;
    }

    public String getTicketDescription() {
        return ticketDescription;
    }

    public void setTicketDescription(String ticketDescription) {
        this.ticketDescription = ticketDescription;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Timestamp endedAt) {
        this.endedAt = endedAt;
    }

    public Integer getRatingPoint() {
        return ratingPoint;
    }

    public void setRatingPoint(Integer ratingPoint) {
        this.ratingPoint = ratingPoint;
    }

    public String getRatingDescription() {
        return ratingDescription;
    }

    public void setRatingDescription(String ratingDescription) {
        this.ratingDescription = ratingDescription;
    }

    public int getCustomerID() {
        return customerID;
    }

    public void setCustomerID(int customerID) {
        this.customerID = customerID;
    }

    public int getRoleID() {
        return roleID;
    }

    public void setRoleID(int roleID) {
        this.roleID = roleID;
    }

    public Integer getStaffID() {
        return staffID;
    }

    public void setStaffID(Integer staffID) {
        this.staffID = staffID;
    }

    public int getTicketStatusID() {
        return ticketStatusID;
    }

    public void setTicketStatusID(int ticketStatusID) {
        this.ticketStatusID = ticketStatusID;
    }

    public Integer getRoomID() {
        return roomID;
    }

    public void setRoomID(Integer roomID) {
        this.roomID = roomID;
    }
}
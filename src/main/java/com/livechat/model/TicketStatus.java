package com.livechat.model;

public class TicketStatus {
    private int ticketStatusID;
    private String ticketStatusCode;
    private String ticketStatusName;

    // Getters and Setters
    public int getTicketStatusID() {
        return ticketStatusID;
    }

    public void setTicketStatusID(int ticketStatusID) {
        this.ticketStatusID = ticketStatusID;
    }

    public String getTicketStatusCode() {
        return ticketStatusCode;
    }

    public void setTicketStatusCode(String ticketStatusCode) {
        this.ticketStatusCode = ticketStatusCode;
    }

    public String getTicketStatusName() {
        return ticketStatusName;
    }

    public void setTicketStatusName(String ticketStatusName) {
        this.ticketStatusName = ticketStatusName;
    }
}
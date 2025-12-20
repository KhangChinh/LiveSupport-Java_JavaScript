package com.livechat.dto;

public class TransferTicketRequest {
    private int ticketID;
    private int newStaffID;

    public int getTicketID() {
        return ticketID;
    }

    public void setTicketID(int ticketID) {
        this.ticketID = ticketID;
    }

    public int getNewStaffID() {
        return newStaffID;
    }

    public void setNewStaffID(int newStaffID) {
        this.newStaffID = newStaffID;
    }
}
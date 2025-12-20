// File: src/main/java/com/livechat/model/FileModel.java
package com.livechat.model;

public class FileModel {
    private int fileID;
    private String filePath;
    private String fileName;
    private int fileTypeID;
    private int accountID;

    // Getters and Setters
    public int getFileID() {
        return fileID;
    }

    public void setFileID(int fileID) {
        this.fileID = fileID;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public int getFileTypeID() {
        return fileTypeID;
    }

    public void setFileTypeID(int fileTypeID) {
        this.fileTypeID = fileTypeID;
    }

    public int getAccountID() {
        return accountID;
    }

    public void setAccountID(int accountID) {
        this.accountID = accountID;
    }
}
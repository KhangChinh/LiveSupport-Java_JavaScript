package com.livechat.util;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.UUID;

public class FileUtil {
    private static String FILE_FOLDER;

    public static void init(String folder) {
        FILE_FOLDER = folder;
        new File(FILE_FOLDER).mkdirs();
    }

    public static String saveFile(byte[] fileBytes, String fileName) throws IOException {
        String ext = getExtension(fileName);
        String subFolder = FILE_FOLDER + File.separator + ext;
        new File(subFolder).mkdirs();
        String uniqueFileName = UUID.randomUUID().toString() + "." + ext;
        String absoluteFilePath = subFolder + File.separator + uniqueFileName;
        try (FileOutputStream fos = new FileOutputStream(absoluteFilePath)) {
            fos.write(fileBytes);
        }
        // Trả về relative path cho DB và client
        String relativePath = "/files/" + ext + "/" + uniqueFileName;
        System.out.println("File saved to absolute path: " + absoluteFilePath);  // Log debug
        System.out.println("Returning relative path for DB: " + relativePath);  // Log debug
        return relativePath;
    }

    public static String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1).toLowerCase();
    }
}
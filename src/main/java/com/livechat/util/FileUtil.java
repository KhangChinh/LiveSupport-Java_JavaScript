package com.livechat.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

public class FileUtil {
    private static String FILE_FOLDER;
    private static Cloudinary cloudinary;

    // Updated init to accept Cloudinary credentials
    public static void init(String folder, String cloudName, String apiKey, String apiSecret) {
        FILE_FOLDER = folder;
        new File(FILE_FOLDER).mkdirs(); // Still need for temp files

        cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true));
    }

    public static String saveFile(byte[] fileBytes, String fileName) throws IOException {
        String ext = getExtension(fileName);
        String tempFilePath = FILE_FOLDER + File.separator + UUID.randomUUID().toString() + "." + ext;

        // Save temp file locally for upload
        try (FileOutputStream fos = new FileOutputStream(tempFilePath)) {
            fos.write(fileBytes);
        }

        try {
            // Upload to Cloudinary
            Map uploadResult = cloudinary.uploader().upload(
                    new File(tempFilePath),
                    ObjectUtils.asMap("resource_type", "auto")
            );
            String publicUrl = (String) uploadResult.get("secure_url");
            System.out.println("Uploaded to Cloudinary: " + publicUrl); 

            // Delete temp file - no permanent local save
            new File(tempFilePath).delete();

            // Return Cloudinary URL for DB and client
            return publicUrl;
        } catch (Exception e) {
            // Clean up on error
            new File(tempFilePath).delete();
            System.err.println("Cloudinary upload failed: " + e.getMessage());
            throw new IOException("Failed to upload to Cloudinary", e);
        }
    }

    public static String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1).toLowerCase();
    }
}
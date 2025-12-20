package com.livechat.util;

import org.mindrot.jbcrypt.BCrypt;

public class BcryptUtil {
    private static String salt;

    public static void init(String customSalt) {
        salt = customSalt;
    }

    public static String hashPassword(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt() + salt);
    }

    public static boolean checkPassword(String password, String hashed) {
        return BCrypt.checkpw(password, hashed);
    }
}
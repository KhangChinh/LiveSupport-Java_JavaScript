package com.livechat.util;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigUtil {
    public static Properties loadConfig() {
        Properties props = new Properties();
        try (InputStream input = ConfigUtil.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (input == null) {
                System.out.println("Sorry, unable to find config.properties");
                return props;
            }
            props.load(input);
        } catch (IOException ex) {
            ex.printStackTrace();
        }
        return props;
    }
}
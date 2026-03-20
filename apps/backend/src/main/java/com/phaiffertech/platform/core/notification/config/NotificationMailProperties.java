package com.phaiffertech.platform.core.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.notification.mail")
public class NotificationMailProperties {

    private String fromAddress = "noreply@phaiffertech.local";
    private String fromName = "PhaifferTech Platform";

    public String getFromAddress() {
        return fromAddress;
    }

    public void setFromAddress(String fromAddress) {
        this.fromAddress = normalize(fromAddress);
    }

    public String getFromName() {
        return fromName;
    }

    public void setFromName(String fromName) {
        this.fromName = normalize(fromName);
    }

    public boolean hasSenderConfigured() {
        return fromAddress != null && !fromAddress.isBlank();
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}

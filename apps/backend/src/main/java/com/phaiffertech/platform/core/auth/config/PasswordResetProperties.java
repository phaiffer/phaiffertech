package com.phaiffertech.platform.core.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.security.password-reset")
public class PasswordResetProperties {

    private int tokenExpiryMinutes = 30;
    private String resetUrlBase = "http://localhost:3000/reset-password";

    public int getTokenExpiryMinutes() {
        return tokenExpiryMinutes;
    }

    public void setTokenExpiryMinutes(int tokenExpiryMinutes) {
        if (tokenExpiryMinutes < 1) {
            throw new IllegalArgumentException("Password reset token expiry must be at least 1 minute.");
        }
        this.tokenExpiryMinutes = tokenExpiryMinutes;
    }

    public String getResetUrlBase() {
        return resetUrlBase;
    }

    public void setResetUrlBase(String resetUrlBase) {
        this.resetUrlBase = normalize(resetUrlBase);
    }

    public boolean hasResetUrlConfigured() {
        return resetUrlBase != null && !resetUrlBase.isBlank();
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}

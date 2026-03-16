package com.phaiffertech.platform.infrastructure.demo;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.demo.commercial")
public class DemoCommercialProperties {

    private boolean enabled;
    private String tenantCode = "phaiffertech-demo";
    private String tenantName = "PhaifferTech Demo";
    private String userEmail;
    private String userPassword;
    private String userFullName = "PhaifferTech Demo Operator";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = normalize(tenantCode, "phaiffertech-demo");
    }

    public String getTenantName() {
        return tenantName;
    }

    public void setTenantName(String tenantName) {
        this.tenantName = normalize(tenantName, "PhaifferTech Demo");
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = normalize(userEmail, null);
    }

    public String getUserPassword() {
        return userPassword;
    }

    public void setUserPassword(String userPassword) {
        this.userPassword = userPassword;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = normalize(userFullName, "PhaifferTech Demo Operator");
    }

    public boolean hasCredentialsConfigured() {
        return isNotBlank(userEmail) && isNotBlank(userPassword);
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}

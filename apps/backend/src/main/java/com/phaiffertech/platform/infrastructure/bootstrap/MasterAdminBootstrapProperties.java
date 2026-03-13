package com.phaiffertech.platform.infrastructure.bootstrap;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.bootstrap.master-admin")
public class MasterAdminBootstrapProperties {

    private boolean enabled;
    private String tenantCode = "PHAIFFER_TECH";
    private String tenantName = "Willian Phaiffer Cardoso Desenvolvimento de Software LTDA";
    private String userEmail = "sysadmin@phaiffer.tech";
    private String userPassword;
    private String fullName = "System Administrator";

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
        this.tenantCode = normalize(tenantCode);
    }

    public String getTenantName() {
        return tenantName;
    }

    public void setTenantName(String tenantName) {
        this.tenantName = normalize(tenantName);
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = normalize(userEmail);
    }

    public String getUserPassword() {
        return userPassword;
    }

    public void setUserPassword(String userPassword) {
        this.userPassword = userPassword;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = normalize(fullName);
    }

    public boolean hasRequiredCredentials() {
        return isNotBlank(tenantCode) && isNotBlank(tenantName) && isNotBlank(userEmail) && isNotBlank(userPassword);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}

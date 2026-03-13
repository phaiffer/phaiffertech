package com.phaiffertech.platform.core.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.demo.assisted")
public class DemoAccessProperties {

    private boolean enabled;
    private String tenantCode;
    private String userEmail;
    private String userPassword;
    private String featureFlagKey = "demo.assisted.enabled";
    private boolean enforceFeatureFlag;

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

    public String getFeatureFlagKey() {
        return featureFlagKey;
    }

    public void setFeatureFlagKey(String featureFlagKey) {
        this.featureFlagKey = normalize(featureFlagKey);
    }

    public boolean isEnforceFeatureFlag() {
        return enforceFeatureFlag;
    }

    public void setEnforceFeatureFlag(boolean enforceFeatureFlag) {
        this.enforceFeatureFlag = enforceFeatureFlag;
    }

    public boolean hasCredentialsConfigured() {
        return isNotBlank(tenantCode) && isNotBlank(userEmail) && isNotBlank(userPassword);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}

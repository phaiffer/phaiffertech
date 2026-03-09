package com.phaiffertech.platform.modules.iot.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.iot.demo")
public class IotDemoProperties {

    private static final String TEST_MODE = "test";

    private boolean enabled;
    private boolean seedOnStartup = true;
    private String tenantCode = "default";
    private String mode = "demo";
    private long generationIntervalMs = 8000L;
    private long initialDelayMs = 12000L;
    private int maxPendingMaintenance = 6;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isSeedOnStartup() {
        return seedOnStartup;
    }

    public void setSeedOnStartup(boolean seedOnStartup) {
        this.seedOnStartup = seedOnStartup;
    }

    public String getTenantCode() {
        return tenantCode;
    }

    public void setTenantCode(String tenantCode) {
        this.tenantCode = tenantCode;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode == null || mode.isBlank() ? "demo" : mode.trim();
    }

    public long getGenerationIntervalMs() {
        return generationIntervalMs;
    }

    public void setGenerationIntervalMs(long generationIntervalMs) {
        this.generationIntervalMs = generationIntervalMs;
    }

    public long getInitialDelayMs() {
        return initialDelayMs;
    }

    public void setInitialDelayMs(long initialDelayMs) {
        this.initialDelayMs = initialDelayMs;
    }

    public int getMaxPendingMaintenance() {
        return maxPendingMaintenance;
    }

    public void setMaxPendingMaintenance(int maxPendingMaintenance) {
        this.maxPendingMaintenance = maxPendingMaintenance;
    }

    public String normalizedMode() {
        return isTestMode() ? TEST_MODE : "demo";
    }

    public boolean isTestMode() {
        return TEST_MODE.equalsIgnoreCase(mode);
    }
}

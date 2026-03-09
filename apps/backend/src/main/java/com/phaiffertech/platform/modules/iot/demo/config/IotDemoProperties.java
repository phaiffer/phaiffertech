package com.phaiffertech.platform.modules.iot.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.iot.demo")
public class IotDemoProperties {

    private boolean enabled;
    private boolean seedOnStartup = true;
    private String tenantCode = "default";
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
}

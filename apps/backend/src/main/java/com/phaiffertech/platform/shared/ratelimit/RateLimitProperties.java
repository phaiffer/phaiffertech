package com.phaiffertech.platform.shared.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;
    private int authPerMinute = 10;
    private int apiPerMinute = 100;
    private int telemetryPerMinute = 500;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getAuthPerMinute() {
        return authPerMinute;
    }

    public void setAuthPerMinute(int authPerMinute) {
        this.authPerMinute = authPerMinute;
    }

    public int getApiPerMinute() {
        return apiPerMinute;
    }

    public void setApiPerMinute(int apiPerMinute) {
        this.apiPerMinute = apiPerMinute;
    }

    public int getTelemetryPerMinute() {
        return telemetryPerMinute;
    }

    public void setTelemetryPerMinute(int telemetryPerMinute) {
        this.telemetryPerMinute = telemetryPerMinute;
    }
}

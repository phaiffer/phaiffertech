package com.phaiffertech.platform.shared.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("redisFutureReady")
public class RedisFutureHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        return Health.up()
                .withDetail("status", "not-configured")
                .withDetail("purpose", "future-cache-and-rate-limit-store")
                .build();
    }
}

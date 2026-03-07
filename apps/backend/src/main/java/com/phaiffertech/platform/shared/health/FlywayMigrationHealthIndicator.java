package com.phaiffertech.platform.shared.health;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfoService;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("migrationStatus")
public class FlywayMigrationHealthIndicator implements HealthIndicator {

    private final Flyway flyway;

    public FlywayMigrationHealthIndicator(Flyway flyway) {
        this.flyway = flyway;
    }

    @Override
    public Health health() {
        MigrationInfoService info = flyway.info();
        int pending = info.pending().length;
        String currentVersion = info.current() == null ? "none" : info.current().getVersion().getVersion();
        if (pending > 0) {
            return Health.status("DEGRADED")
                    .withDetail("currentVersion", currentVersion)
                    .withDetail("pendingMigrations", pending)
                    .build();
        }
        return Health.up()
                .withDetail("currentVersion", currentVersion)
                .withDetail("pendingMigrations", 0)
                .build();
    }
}

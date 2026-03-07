package com.phaiffertech.platform.shared.health;

import com.phaiffertech.platform.modules.iot.processing.TelemetryReader;
import com.phaiffertech.platform.modules.iot.processing.TelemetryWriter;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("telemetryPipeline")
public class TelemetryPipelineHealthIndicator implements HealthIndicator {

    private final TelemetryWriter telemetryWriter;
    private final TelemetryReader telemetryReader;

    public TelemetryPipelineHealthIndicator(TelemetryWriter telemetryWriter, TelemetryReader telemetryReader) {
        this.telemetryWriter = telemetryWriter;
        this.telemetryReader = telemetryReader;
    }

    @Override
    public Health health() {
        boolean ready = telemetryWriter != null && telemetryReader != null;
        if (!ready) {
            return Health.down()
                    .withDetail("writerAvailable", telemetryWriter != null)
                    .withDetail("readerAvailable", telemetryReader != null)
                    .build();
        }
        return Health.up()
                .withDetail("writer", telemetryWriter.getClass().getSimpleName())
                .withDetail("reader", telemetryReader.getClass().getSimpleName())
                .build();
    }
}

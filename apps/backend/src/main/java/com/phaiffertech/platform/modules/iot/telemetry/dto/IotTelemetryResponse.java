package com.phaiffertech.platform.modules.iot.telemetry.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record IotTelemetryResponse(
        UUID id,
        UUID deviceId,
        String metric,
        BigDecimal value,
        Instant recordedAt,
        Instant createdAt
) {
}

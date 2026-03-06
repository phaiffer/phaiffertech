package com.phaiffertech.platform.modules.iot.telemetry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record IotTelemetryCreateRequest(
        @NotNull UUID deviceId,
        @NotBlank String metric,
        @NotNull BigDecimal value,
        Instant recordedAt
) {
}

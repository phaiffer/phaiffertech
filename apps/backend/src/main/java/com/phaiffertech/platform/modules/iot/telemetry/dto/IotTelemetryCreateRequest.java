package com.phaiffertech.platform.modules.iot.telemetry.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record IotTelemetryCreateRequest(
        @NotNull UUID deviceId,
        @NotBlank @JsonAlias("metric") String metricName,
        @NotNull @JsonAlias("value") BigDecimal metricValue,
        String unit,
        Map<String, Object> metadata,
        Instant recordedAt
) {
}

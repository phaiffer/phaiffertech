package com.phaiffertech.platform.modules.iot.telemetry.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record IotTelemetryResponse(
        UUID id,
        UUID deviceId,
        UUID registerId,
        String metricName,
        BigDecimal metricValue,
        String unit,
        Map<String, Object> metadata,
        Instant recordedAt,
        Instant createdAt
) {

    @JsonProperty("metric")
    public String legacyMetric() {
        return metricName;
    }

    @JsonProperty("value")
    public BigDecimal legacyValue() {
        return metricValue;
    }
}

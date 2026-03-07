package com.phaiffertech.platform.modules.iot.register.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record IotRegisterResponse(
        UUID id,
        UUID deviceId,
        String name,
        String code,
        String metricName,
        String unit,
        String dataType,
        BigDecimal minThreshold,
        BigDecimal maxThreshold,
        String status,
        Instant createdAt,
        Instant updatedAt
) {
}

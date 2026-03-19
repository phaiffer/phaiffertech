package com.phaiffertech.platform.shared.usage.dto;

import java.time.Instant;
import java.time.LocalDate;

public record TenantUsageMetricResponse(
        String metricKey,
        String source,
        long quantity,
        String unit,
        LocalDate metricDate,
        Instant lastRecordedAt
) {
}

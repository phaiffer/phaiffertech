package com.phaiffertech.platform.shared.dashboard.dto;

public record DashboardCountMetricDto(
        String key,
        String label,
        long value
) {
}

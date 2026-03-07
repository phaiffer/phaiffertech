package com.phaiffertech.platform.shared.dashboard.dto;

public record DashboardSummaryCardDto(
        String key,
        String label,
        long value,
        String trend,
        String status,
        String href
) {
}

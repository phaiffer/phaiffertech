package com.phaiffertech.platform.shared.dashboard.dto;

import java.util.List;

public record DashboardSectionDto(
        String key,
        String title,
        String description,
        List<DashboardSummaryCardDto> cards,
        List<DashboardCountMetricDto> metrics,
        List<DashboardListItemDto> items,
        List<DashboardTimeSeriesPointDto> timeSeries
) {
}

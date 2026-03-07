package com.phaiffertech.platform.shared.dashboard.dto;

import java.util.List;

public record DashboardModuleSummaryDto(
        String moduleCode,
        String title,
        String description,
        String href,
        List<DashboardSummaryCardDto> summaryCards
) {
}

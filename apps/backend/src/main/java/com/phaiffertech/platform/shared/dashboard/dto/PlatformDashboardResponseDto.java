package com.phaiffertech.platform.shared.dashboard.dto;

import java.util.List;

public record PlatformDashboardResponseDto(
        DashboardSectionDto coreSummary,
        List<DashboardModuleSummaryDto> modules
) {
}

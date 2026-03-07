package com.phaiffertech.platform.modules.iot.monitoring.dto;

import com.phaiffertech.platform.shared.dashboard.dto.DashboardSectionDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSummaryCardDto;
import java.util.List;
import java.util.Map;

public record IotDashboardSummaryResponse(
        long totalDevices,
        long activeDevices,
        long offlineDevices,
        long totalAlarmsOpen,
        Map<String, Long> alarmsBySeverity,
        long telemetryPointsLast24h,
        long pendingMaintenance,
        Map<String, Long> devicesLastSeenSummary,
        List<DashboardSummaryCardDto> summaryCards,
        List<DashboardSectionDto> sections
) {
}

package com.phaiffertech.platform.modules.iot.monitoring.dto;

import java.util.Map;

public record IotDashboardSummaryResponse(
        long totalDevices,
        long activeDevices,
        long offlineDevices,
        long totalAlarmsOpen,
        Map<String, Long> alarmsBySeverity,
        long telemetryPointsLast24h,
        long pendingMaintenance,
        Map<String, Long> devicesLastSeenSummary
) {
}

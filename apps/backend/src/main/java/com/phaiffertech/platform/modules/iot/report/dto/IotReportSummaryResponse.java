package com.phaiffertech.platform.modules.iot.report.dto;

import java.time.Instant;
import java.util.Map;

public record IotReportSummaryResponse(
        long totalDevices,
        long totalRegisters,
        long telemetryPointsLast24h,
        long openAlarms,
        long pendingMaintenance,
        Map<String, Long> devicesByStatus,
        Map<String, Long> telemetryByMetric,
        Map<String, Long> alarmsByStatus,
        Map<String, Long> alarmsBySeverity,
        Map<String, Long> maintenanceByStatus,
        Instant generatedAt
) {
}

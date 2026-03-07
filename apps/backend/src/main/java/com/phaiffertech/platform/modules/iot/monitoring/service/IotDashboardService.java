package com.phaiffertech.platform.modules.iot.monitoring.service;

import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.maintenance.repository.IotMaintenanceRepository;
import com.phaiffertech.platform.modules.iot.monitoring.dto.IotDashboardSummaryResponse;
import com.phaiffertech.platform.modules.iot.monitoring.repository.IotMonitoringRepository;
import com.phaiffertech.platform.modules.iot.processing.DeviceStatusService;
import com.phaiffertech.platform.modules.iot.processing.DeviceStatusSnapshot;
import com.phaiffertech.platform.modules.iot.telemetry.repository.IotTelemetryRecordRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IotDashboardService implements MonitoringSummaryService {

    private static final Duration LAST_5_MINUTES = Duration.ofMinutes(5);
    private static final Duration LAST_60_MINUTES = Duration.ofMinutes(60);

    private final IotDeviceRepository deviceRepository;
    private final DeviceStatusService deviceStatusService;
    private final IotMonitoringRepository monitoringRepository;
    private final IotTelemetryRecordRepository telemetryRecordRepository;
    private final IotMaintenanceRepository maintenanceRepository;

    public IotDashboardService(
            IotDeviceRepository deviceRepository,
            DeviceStatusService deviceStatusService,
            IotMonitoringRepository monitoringRepository,
            IotTelemetryRecordRepository telemetryRecordRepository,
            IotMaintenanceRepository maintenanceRepository
    ) {
        this.deviceRepository = deviceRepository;
        this.deviceStatusService = deviceStatusService;
        this.monitoringRepository = monitoringRepository;
        this.telemetryRecordRepository = telemetryRecordRepository;
        this.maintenanceRepository = maintenanceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public IotDashboardSummaryResponse summary() {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Instant now = Instant.now();

        long activeDevices = 0L;
        long offlineDevices = 0L;
        Map<String, Long> lastSeenSummary = initLastSeenSummary();

        var devices = deviceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
        for (var device : devices) {
            DeviceStatusSnapshot snapshot = deviceStatusService.evaluate(tenantId, device.getId());
            if ("OFFLINE".equalsIgnoreCase(snapshot.status())) {
                offlineDevices++;
            } else {
                activeDevices++;
            }
            bucketLastSeen(lastSeenSummary, snapshot.lastSeenAt(), now);
        }

        return new IotDashboardSummaryResponse(
                devices.size(),
                activeDevices,
                offlineDevices,
                monitoringRepository.countOpenAlarms(tenantId),
                monitoringRepository.countOpenAlarmsBySeverity(tenantId),
                telemetryRecordRepository.countByTenantIdAndRecordedAtAfter(tenantId, now.minus(Duration.ofHours(24))),
                maintenanceRepository.countByTenantIdAndStatusInAndDeletedAtIsNull(
                        tenantId,
                        java.util.List.of("PENDING", "SCHEDULED", "IN_PROGRESS")
                ),
                lastSeenSummary
        );
    }

    private Map<String, Long> initLastSeenSummary() {
        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("last_5m", 0L);
        summary.put("last_60m", 0L);
        summary.put("stale", 0L);
        summary.put("never_seen", 0L);
        return summary;
    }

    private void bucketLastSeen(Map<String, Long> summary, Instant lastSeenAt, Instant now) {
        String bucket;
        if (lastSeenAt == null) {
            bucket = "never_seen";
        } else if (!lastSeenAt.isBefore(now.minus(LAST_5_MINUTES))) {
            bucket = "last_5m";
        } else if (!lastSeenAt.isBefore(now.minus(LAST_60_MINUTES))) {
            bucket = "last_60m";
        } else {
            bucket = "stale";
        }
        summary.put(bucket, summary.get(bucket) + 1);
    }
}

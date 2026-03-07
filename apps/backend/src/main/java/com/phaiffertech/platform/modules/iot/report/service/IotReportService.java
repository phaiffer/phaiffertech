package com.phaiffertech.platform.modules.iot.report.service;

import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.maintenance.repository.IotMaintenanceRepository;
import com.phaiffertech.platform.modules.iot.monitoring.repository.IotMonitoringRepository;
import com.phaiffertech.platform.modules.iot.processing.DeviceStatusService;
import com.phaiffertech.platform.modules.iot.register.repository.IotRegisterRepository;
import com.phaiffertech.platform.modules.iot.report.dto.IotReportSummaryResponse;
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
public class IotReportService {

    private final IotDeviceRepository deviceRepository;
    private final IotRegisterRepository registerRepository;
    private final IotTelemetryRecordRepository telemetryRecordRepository;
    private final IotMonitoringRepository monitoringRepository;
    private final IotMaintenanceRepository maintenanceRepository;
    private final DeviceStatusService deviceStatusService;

    public IotReportService(
            IotDeviceRepository deviceRepository,
            IotRegisterRepository registerRepository,
            IotTelemetryRecordRepository telemetryRecordRepository,
            IotMonitoringRepository monitoringRepository,
            IotMaintenanceRepository maintenanceRepository,
            DeviceStatusService deviceStatusService
    ) {
        this.deviceRepository = deviceRepository;
        this.registerRepository = registerRepository;
        this.telemetryRecordRepository = telemetryRecordRepository;
        this.monitoringRepository = monitoringRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.deviceStatusService = deviceStatusService;
    }

    @Transactional(readOnly = true)
    public IotReportSummaryResponse summary() {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Instant generatedAt = Instant.now();
        var devices = deviceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);

        Map<String, Long> devicesByStatus = new LinkedHashMap<>();
        for (var device : devices) {
            String status = deviceStatusService.evaluate(tenantId, device.getId()).status();
            devicesByStatus.put(status, devicesByStatus.getOrDefault(status, 0L) + 1);
        }

        long telemetryPointsLast24h = telemetryRecordRepository.countByTenantIdAndRecordedAtAfter(
                tenantId,
                generatedAt.minus(Duration.ofHours(24))
        );
        long pendingMaintenance = maintenanceRepository.countByTenantIdAndStatusInAndDeletedAtIsNull(
                tenantId,
                java.util.List.of("PENDING", "SCHEDULED", "IN_PROGRESS")
        );

        return new IotReportSummaryResponse(
                devices.size(),
                registerRepository.countByTenantId(tenantId),
                telemetryPointsLast24h,
                monitoringRepository.countOpenAlarms(tenantId),
                pendingMaintenance,
                devicesByStatus,
                monitoringRepository.countTelemetryByMetricName(tenantId, generatedAt.minus(Duration.ofHours(24))),
                monitoringRepository.countAlarmsByStatus(tenantId),
                monitoringRepository.countOpenAlarmsBySeverity(tenantId),
                monitoringRepository.countMaintenanceByStatus(tenantId),
                generatedAt
        );
    }
}

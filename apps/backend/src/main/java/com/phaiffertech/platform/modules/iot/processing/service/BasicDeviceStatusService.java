package com.phaiffertech.platform.modules.iot.processing.service;

import com.phaiffertech.platform.modules.iot.alarm.repository.IotAlarmRepository;
import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.processing.DeviceStatusService;
import com.phaiffertech.platform.modules.iot.processing.DeviceStatusSnapshot;
import com.phaiffertech.platform.modules.iot.telemetry.repository.IotTelemetryRecordRepository;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BasicDeviceStatusService implements DeviceStatusService {

    private static final Duration ONLINE_WINDOW = Duration.ofMinutes(15);
    private static final List<String> OPEN_ALARM_STATUSES = List.of("OPEN", "ACKNOWLEDGED");

    private final IotDeviceRepository deviceRepository;
    private final IotTelemetryRecordRepository telemetryRecordRepository;
    private final IotAlarmRepository alarmRepository;

    public BasicDeviceStatusService(
            IotDeviceRepository deviceRepository,
            IotTelemetryRecordRepository telemetryRecordRepository,
            IotAlarmRepository alarmRepository
    ) {
        this.deviceRepository = deviceRepository;
        this.telemetryRecordRepository = telemetryRecordRepository;
        this.alarmRepository = alarmRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DeviceStatusSnapshot evaluate(UUID tenantId, UUID deviceId) {
        IotDevice device = deviceRepository.findByIdAndTenantId(deviceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT device not found for tenant."));
        return evaluateDevice(tenantId, device, null);
    }

    @Override
    @Transactional
    public DeviceStatusSnapshot refreshFromTelemetry(UUID tenantId, UUID deviceId, Instant observedAt) {
        IotDevice device = deviceRepository.findByIdAndTenantId(deviceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT device not found for tenant."));

        Instant effectiveObservedAt = observedAt == null ? Instant.now() : observedAt;
        if (device.getLastSeenAt() == null || effectiveObservedAt.isAfter(device.getLastSeenAt())) {
            device.setLastSeenAt(effectiveObservedAt);
        }

        DeviceStatusSnapshot snapshot = evaluateDevice(tenantId, device, effectiveObservedAt);
        device.setStatus(snapshot.status());
        deviceRepository.save(device);
        return snapshot;
    }

    private DeviceStatusSnapshot evaluateDevice(UUID tenantId, IotDevice device, Instant observedAt) {
        Instant latestTelemetryAt = telemetryRecordRepository.findLatestRecordedAt(tenantId, device.getId()).orElse(null);
        Instant lastSeenAt = max(device.getLastSeenAt(), max(latestTelemetryAt, observedAt));
        boolean recentTelemetry = lastSeenAt != null && !lastSeenAt.isBefore(Instant.now().minus(ONLINE_WINDOW));
        boolean hasCriticalOpenAlarm = alarmRepository.existsByTenantIdAndDeviceIdAndSeverityAndStatusIn(
                tenantId,
                device.getId(),
                "CRITICAL",
                OPEN_ALARM_STATUSES
        );

        String status = resolveStatus(device.getStatus(), recentTelemetry, hasCriticalOpenAlarm);
        return new DeviceStatusSnapshot(status, lastSeenAt, recentTelemetry, hasCriticalOpenAlarm);
    }

    private String resolveStatus(String currentStatus, boolean recentTelemetry, boolean hasCriticalOpenAlarm) {
        if ("MAINTENANCE".equalsIgnoreCase(currentStatus)) {
            return "MAINTENANCE";
        }
        if (hasCriticalOpenAlarm) {
            return "ALERT";
        }
        if (recentTelemetry) {
            return "ONLINE";
        }
        return "OFFLINE";
    }

    private Instant max(Instant left, Instant right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return left.isAfter(right) ? left : right;
    }
}

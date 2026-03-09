package com.phaiffertech.platform.modules.iot.maintenance.dto;

import java.time.Instant;
import java.util.UUID;

public record IotMaintenanceResponse(
        UUID id,
        UUID deviceId,
        UUID linkedAlarmId,
        UUID linkedRegisterId,
        String linkedAlarmCode,
        String title,
        String description,
        String status,
        String priority,
        String origin,
        String trigger,
        Instant scheduledAt,
        Instant completedAt,
        UUID assignedUserId,
        String assignedUserLabel,
        Instant createdAt,
        Instant updatedAt
) {
}

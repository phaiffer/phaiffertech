package com.phaiffertech.platform.modules.iot.maintenance.dto;

import java.time.Instant;
import java.util.UUID;

public record IotMaintenanceResponse(
        UUID id,
        UUID deviceId,
        String title,
        String description,
        String status,
        String priority,
        Instant scheduledAt,
        Instant completedAt,
        UUID assignedUserId,
        Instant createdAt,
        Instant updatedAt
) {
}

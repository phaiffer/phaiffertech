package com.phaiffertech.platform.modules.iot.alarm.dto;

import java.time.Instant;
import java.util.UUID;

public record IotAlarmResponse(
        UUID id,
        UUID deviceId,
        UUID registerId,
        String code,
        String message,
        String severity,
        String status,
        Instant triggeredAt,
        Instant acknowledgedAt,
        UUID acknowledgedBy,
        Instant createdAt,
        Instant updatedAt
) {
}

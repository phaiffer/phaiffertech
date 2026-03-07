package com.phaiffertech.platform.modules.iot.alarm.dto;

import java.time.Instant;
import java.util.UUID;

public record IotAlarmResponse(
        UUID id,
        UUID deviceId,
        String code,
        String message,
        String severity,
        String status,
        Instant triggeredAt,
        Instant acknowledgedAt,
        Instant createdAt,
        Instant updatedAt
) {
}

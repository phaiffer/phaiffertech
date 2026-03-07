package com.phaiffertech.platform.modules.iot.alarm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record IotAlarmUpdateRequest(
        @NotNull UUID deviceId,
        UUID registerId,
        @NotBlank String code,
        @NotBlank String message,
        @NotBlank String severity,
        @NotBlank String status,
        Instant triggeredAt,
        Instant acknowledgedAt
) {
}

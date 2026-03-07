package com.phaiffertech.platform.modules.iot.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record IotMaintenanceUpdateRequest(
        @NotNull UUID deviceId,
        @NotBlank String title,
        String description,
        @NotBlank String status,
        @NotBlank String priority,
        Instant scheduledAt,
        Instant completedAt,
        UUID assignedUserId
) {
}

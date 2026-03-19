package com.phaiffertech.platform.modules.iot.part.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record IotPartMovementCreateRequest(
        @NotBlank String movementType,
        @NotNull @Min(1) Integer quantity,
        UUID maintenanceId,
        String reason
) {
}

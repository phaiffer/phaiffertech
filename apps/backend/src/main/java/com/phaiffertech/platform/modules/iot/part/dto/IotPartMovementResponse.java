package com.phaiffertech.platform.modules.iot.part.dto;

import java.time.Instant;
import java.util.UUID;

public record IotPartMovementResponse(
        UUID id,
        UUID partId,
        String partName,
        String partSku,
        String movementType,
        Integer quantity,
        String sourceType,
        String reason,
        Integer quantityBefore,
        Integer quantityAfter,
        Instant createdAt,
        Instant updatedAt
) {
}

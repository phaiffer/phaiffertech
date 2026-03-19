package com.phaiffertech.platform.modules.iot.part.dto;

import java.time.Instant;
import java.util.UUID;

public record IotPartResponse(
        UUID id,
        String name,
        String sku,
        String category,
        String unitOfMeasure,
        Integer currentQuantity,
        Integer minimumQuantity,
        Integer reorderPoint,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
}

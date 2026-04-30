package com.phaiffertech.platform.modules.pet.product.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetProductResponse(
        UUID id,
        UUID inventoryItemId,
        String name,
        String sku,
        BigDecimal price,
        String category,
        String unitOfMeasure,
        Integer currentQuantity,
        Integer stockQuantity,
        Integer minimumQuantity,
        Integer reorderPoint,
        Instant createdAt,
        Instant updatedAt
) {
}

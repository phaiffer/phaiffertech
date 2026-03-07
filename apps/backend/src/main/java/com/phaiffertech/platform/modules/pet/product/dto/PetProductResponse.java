package com.phaiffertech.platform.modules.pet.product.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetProductResponse(
        UUID id,
        String name,
        String sku,
        BigDecimal price,
        Integer stockQuantity,
        Instant createdAt,
        Instant updatedAt
) {
}

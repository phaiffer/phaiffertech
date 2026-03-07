package com.phaiffertech.platform.modules.pet.servicecatalog.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetServiceCatalogResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        Integer durationMinutes,
        Instant createdAt,
        Instant updatedAt
) {
}

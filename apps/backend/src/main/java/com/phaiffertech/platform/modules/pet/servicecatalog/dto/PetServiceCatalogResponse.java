package com.phaiffertech.platform.modules.pet.servicecatalog.dto;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCategory;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetServiceCatalogResponse(
        UUID id,
        String name,
        String description,
        PetServiceCategory category,
        boolean active,
        BigDecimal basePrice,
        Integer durationMinutes,
        boolean commissionEligible,
        boolean allowInPlans,
        boolean allowStandaloneBooking,
        Instant createdAt,
        Instant updatedAt
) {
}

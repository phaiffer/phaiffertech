package com.phaiffertech.platform.modules.pet.petprofile.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PetProfileResponse(
        UUID id,
        UUID clientId,
        String name,
        String species,
        String breed,
        LocalDate birthDate,
        String gender,
        BigDecimal weight,
        String color,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}

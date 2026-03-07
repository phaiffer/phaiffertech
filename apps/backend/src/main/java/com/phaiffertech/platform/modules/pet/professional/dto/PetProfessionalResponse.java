package com.phaiffertech.platform.modules.pet.professional.dto;

import java.time.Instant;
import java.util.UUID;

public record PetProfessionalResponse(
        UUID id,
        String name,
        String specialty,
        String licenseNumber,
        String phone,
        String email,
        Instant createdAt,
        Instant updatedAt
) {
}

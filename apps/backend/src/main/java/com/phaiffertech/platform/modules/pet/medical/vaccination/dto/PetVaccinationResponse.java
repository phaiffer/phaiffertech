package com.phaiffertech.platform.modules.pet.medical.vaccination.dto;

import java.time.Instant;
import java.util.UUID;

public record PetVaccinationResponse(
        UUID id,
        UUID petId,
        String vaccineName,
        Instant appliedAt,
        Instant nextDueAt,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}

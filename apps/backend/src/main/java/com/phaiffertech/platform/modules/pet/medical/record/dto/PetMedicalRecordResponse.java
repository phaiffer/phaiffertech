package com.phaiffertech.platform.modules.pet.medical.record.dto;

import java.time.Instant;
import java.util.UUID;

public record PetMedicalRecordResponse(
        UUID id,
        UUID petId,
        UUID professionalId,
        String description,
        String diagnosis,
        String treatment,
        Instant createdAt,
        Instant updatedAt
) {
}

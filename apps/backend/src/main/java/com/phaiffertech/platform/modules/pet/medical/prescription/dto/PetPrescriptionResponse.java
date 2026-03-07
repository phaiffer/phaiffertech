package com.phaiffertech.platform.modules.pet.medical.prescription.dto;

import java.time.Instant;
import java.util.UUID;

public record PetPrescriptionResponse(
        UUID id,
        UUID petId,
        UUID professionalId,
        String medication,
        String dosage,
        String instructions,
        Instant createdAt,
        Instant updatedAt
) {
}

package com.phaiffertech.platform.modules.pet.medical.prescription.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PetPrescriptionCreateRequest(
        @NotNull UUID petId,
        @NotNull UUID professionalId,
        @NotBlank String medication,
        String dosage,
        String instructions
) {
}

package com.phaiffertech.platform.modules.pet.medical.record.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PetMedicalRecordUpdateRequest(
        @NotNull UUID petId,
        @NotNull UUID professionalId,
        @NotBlank String description,
        String diagnosis,
        String treatment
) {
}

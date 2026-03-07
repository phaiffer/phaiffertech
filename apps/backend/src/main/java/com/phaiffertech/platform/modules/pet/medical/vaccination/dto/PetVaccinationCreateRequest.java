package com.phaiffertech.platform.modules.pet.medical.vaccination.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record PetVaccinationCreateRequest(
        @NotNull UUID petId,
        @NotBlank String vaccineName,
        @NotNull Instant appliedAt,
        Instant nextDueAt,
        String notes
) {
}

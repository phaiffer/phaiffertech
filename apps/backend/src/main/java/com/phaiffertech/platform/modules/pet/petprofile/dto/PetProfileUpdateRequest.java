package com.phaiffertech.platform.modules.pet.petprofile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PetProfileUpdateRequest(
        @NotNull UUID clientId,
        @NotBlank String name,
        @NotBlank String species,
        String breed,
        LocalDate birthDate,
        String gender,
        BigDecimal weight,
        String color,
        String notes
) {
}

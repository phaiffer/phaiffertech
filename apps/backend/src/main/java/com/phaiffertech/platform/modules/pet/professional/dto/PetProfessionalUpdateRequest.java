package com.phaiffertech.platform.modules.pet.professional.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record PetProfessionalUpdateRequest(
        @NotBlank String name,
        String specialty,
        String licenseNumber,
        String phone,
        @Email String email,
        BigDecimal commissionRate
) {
}

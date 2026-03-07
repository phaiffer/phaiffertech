package com.phaiffertech.platform.modules.pet.professional.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PetProfessionalCreateRequest(
        @NotBlank String name,
        String specialty,
        String licenseNumber,
        String phone,
        @Email String email
) {
}

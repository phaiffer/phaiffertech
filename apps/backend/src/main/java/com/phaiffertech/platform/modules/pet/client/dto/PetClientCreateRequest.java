package com.phaiffertech.platform.modules.pet.client.dto;

import jakarta.validation.constraints.NotBlank;

public record PetClientCreateRequest(
        @NotBlank String fullName,
        String email,
        String phone
) {
}

package com.phaiffertech.platform.modules.pet.client.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PetClientUpdateRequest(
        @NotBlank @JsonAlias("fullName") String name,
        @Email String email,
        String phone,
        String document,
        @NotBlank String status
) {
}

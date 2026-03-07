package com.phaiffertech.platform.modules.pet.client.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PetClientCreateRequest(
        @NotBlank @JsonAlias("fullName") String name,
        @Email String email,
        String phone,
        String document,
        String status
) {
}

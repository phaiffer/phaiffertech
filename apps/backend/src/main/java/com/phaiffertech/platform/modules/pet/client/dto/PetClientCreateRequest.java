package com.phaiffertech.platform.modules.pet.client.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PetClientCreateRequest(
        @NotBlank @JsonAlias({"fullName", "primaryResponsibleName"}) String name,
        @Email @JsonAlias("primaryResponsibleEmail") String email,
        @JsonAlias("primaryResponsiblePhone") String phone,
        @NotBlank String documentType,
        @NotBlank String document,
        String address,
        String status
) {
}

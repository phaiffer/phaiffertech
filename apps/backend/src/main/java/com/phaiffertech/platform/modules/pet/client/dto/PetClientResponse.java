package com.phaiffertech.platform.modules.pet.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public record PetClientResponse(
        UUID id,
        String name,
        String email,
        String phone,
        String document,
        String address,
        String status,
        Instant createdAt,
        Instant updatedAt
) {

    @JsonProperty("fullName")
    public String legacyFullName() {
        return name;
    }
}

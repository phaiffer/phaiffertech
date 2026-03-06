package com.phaiffertech.platform.modules.pet.client.dto;

import java.util.UUID;

public record PetClientResponse(
        UUID id,
        String fullName,
        String email,
        String phone
) {
}

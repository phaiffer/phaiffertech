package com.phaiffertech.platform.modules.pet.client.mapper;

import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientResponse;

public final class PetClientMapper {

    private PetClientMapper() {
    }

    public static PetClientResponse toResponse(PetClient client) {
        return new PetClientResponse(client.getId(), client.getFullName(), client.getEmail(), client.getPhone());
    }
}

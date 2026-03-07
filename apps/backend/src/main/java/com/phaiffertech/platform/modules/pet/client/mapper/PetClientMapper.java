package com.phaiffertech.platform.modules.pet.client.mapper;

import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientCreateRequest;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientResponse;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetClientMapper implements BaseCrudMapper<
        PetClient,
        PetClientCreateRequest,
        PetClientUpdateRequest,
        PetClientResponse> {

    public static final PetClientMapper INSTANCE = new PetClientMapper();

    private PetClientMapper() {
    }

    @Override
    public PetClient toNewEntity(PetClientCreateRequest request) {
        PetClient client = new PetClient();
        String normalizedName = request.name().trim();
        client.setName(normalizedName);
        client.setFullName(normalizedName);
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client.setDocument(request.document());
        client.setStatus(resolveStatus(request.status()));
        return client;
    }

    @Override
    public void updateEntity(PetClient entity, PetClientUpdateRequest request) {
        String normalizedName = request.name().trim();
        entity.setName(normalizedName);
        entity.setFullName(normalizedName);
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        entity.setDocument(request.document());
        entity.setStatus(resolveStatus(request.status()));
    }

    @Override
    public PetClientResponse toResponse(PetClient client) {
        return new PetClientResponse(
                client.getId(),
                client.getName(),
                client.getEmail(),
                client.getPhone(),
                client.getDocument(),
                client.getStatus(),
                client.getCreatedAt(),
                client.getUpdatedAt()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return status.trim().toUpperCase();
    }
}

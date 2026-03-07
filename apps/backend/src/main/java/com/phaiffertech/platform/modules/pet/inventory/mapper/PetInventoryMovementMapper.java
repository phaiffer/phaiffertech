package com.phaiffertech.platform.modules.pet.inventory.mapper;

import com.phaiffertech.platform.modules.pet.inventory.domain.PetInventoryMovement;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementCreateRequest;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementResponse;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetInventoryMovementMapper implements BaseCrudMapper<
        PetInventoryMovement,
        PetInventoryMovementCreateRequest,
        PetInventoryMovementUpdateRequest,
        PetInventoryMovementResponse> {

    public static final PetInventoryMovementMapper INSTANCE = new PetInventoryMovementMapper();

    private PetInventoryMovementMapper() {
    }

    @Override
    public PetInventoryMovement toNewEntity(PetInventoryMovementCreateRequest request) {
        PetInventoryMovement entity = new PetInventoryMovement();
        entity.setProductId(request.productId());
        entity.setMovementType(normalizeType(request.movementType()));
        entity.setQuantity(request.quantity());
        entity.setNotes(trimToNull(request.notes()));
        return entity;
    }

    @Override
    public void updateEntity(PetInventoryMovement entity, PetInventoryMovementUpdateRequest request) {
        entity.setProductId(request.productId());
        entity.setMovementType(normalizeType(request.movementType()));
        entity.setQuantity(request.quantity());
        entity.setNotes(trimToNull(request.notes()));
    }

    @Override
    public PetInventoryMovementResponse toResponse(PetInventoryMovement entity) {
        return new PetInventoryMovementResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getMovementType(),
                entity.getQuantity(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String normalizeType(String movementType) {
        return movementType.trim().toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

package com.phaiffertech.platform.modules.pet.inventory.dto;

import java.time.Instant;
import java.util.UUID;

public record PetInventoryMovementResponse(
        UUID id,
        UUID productId,
        String movementType,
        Integer quantity,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}

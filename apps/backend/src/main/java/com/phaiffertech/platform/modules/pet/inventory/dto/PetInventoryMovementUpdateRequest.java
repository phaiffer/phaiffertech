package com.phaiffertech.platform.modules.pet.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PetInventoryMovementUpdateRequest(
        @NotNull UUID productId,
        @NotBlank String movementType,
        @NotNull @Min(1) Integer quantity,
        String notes
) {
}

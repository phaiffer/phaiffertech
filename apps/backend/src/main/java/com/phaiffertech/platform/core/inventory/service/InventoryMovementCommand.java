package com.phaiffertech.platform.core.inventory.service;

import com.phaiffertech.platform.core.inventory.domain.InventoryMovementSource;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementType;
import java.util.UUID;

public record InventoryMovementCommand(
        UUID inventoryItemId,
        InventoryMovementType movementType,
        Integer quantity,
        InventoryMovementSource sourceType,
        UUID sourceReferenceId,
        String reason
) {
}

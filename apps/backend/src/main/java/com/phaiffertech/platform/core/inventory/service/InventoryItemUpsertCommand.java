package com.phaiffertech.platform.core.inventory.service;

import com.phaiffertech.platform.core.inventory.domain.InventoryItemCategory;

public record InventoryItemUpsertCommand(
        String name,
        String sku,
        InventoryItemCategory category,
        String unitOfMeasure,
        Integer currentQuantity,
        Integer minimumQuantity,
        Integer reorderPoint
) {
}

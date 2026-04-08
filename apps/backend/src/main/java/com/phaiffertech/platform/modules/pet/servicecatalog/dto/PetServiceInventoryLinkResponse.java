package com.phaiffertech.platform.modules.pet.servicecatalog.dto;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryConsumptionRule;
import java.math.BigDecimal;
import java.util.UUID;

public record PetServiceInventoryLinkResponse(
        UUID id,
        UUID inventoryItemId,
        String inventoryItemName,
        String inventoryItemSku,
        String inventoryCategory,
        String unitOfMeasure,
        BigDecimal expectedQuantity,
        PetServiceInventoryConsumptionRule consumptionRule,
        boolean active
) {
}

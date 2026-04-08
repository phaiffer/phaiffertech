package com.phaiffertech.platform.modules.pet.servicecatalog.dto;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryConsumptionRule;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record PetServiceInventoryLinkRequest(
        @NotNull UUID inventoryItemId,
        @NotNull @DecimalMin("0.01") BigDecimal expectedQuantity,
        @NotNull PetServiceInventoryConsumptionRule consumptionRule,
        @NotNull Boolean active
) {
}

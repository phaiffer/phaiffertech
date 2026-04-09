package com.phaiffertech.platform.modules.pet.appointment.dto;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentInventoryConsumptionStatus;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryConsumptionRule;
import java.math.BigDecimal;
import java.util.UUID;

public record PetAppointmentServiceLineInventoryResponse(
        UUID inventoryItemId,
        String inventoryItemName,
        String inventoryItemSku,
        String inventoryCategory,
        String unitOfMeasure,
        BigDecimal expectedQuantity,
        BigDecimal actualQuantity,
        PetAppointmentInventoryConsumptionStatus consumptionStatus,
        PetServiceInventoryConsumptionRule consumptionRule,
        boolean snapshotBacked
) {
}

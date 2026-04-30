package com.phaiffertech.platform.modules.pet.appointment.dto;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentInventoryConsumptionStatus;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentInventoryVarianceStatus;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryConsumptionRule;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetAppointmentServiceLineInventoryResponse(
        UUID id,
        UUID inventoryItemId,
        String inventoryItemName,
        String inventoryItemSku,
        String inventoryCategory,
        String unitOfMeasure,
        BigDecimal expectedQuantity,
        BigDecimal actualQuantity,
        PetAppointmentInventoryConsumptionStatus consumptionStatus,
        PetServiceInventoryConsumptionRule consumptionRule,
        boolean snapshotBacked,
        boolean stockApplied,
        BigDecimal appliedQuantity,
        BigDecimal plannedActualVarianceQuantity,
        BigDecimal plannedAppliedVarianceQuantity,
        PetAppointmentInventoryVarianceStatus varianceStatus,
        UUID appliedInventoryMovementId,
        Instant stockAppliedAt
) {
}

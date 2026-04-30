package com.phaiffertech.platform.modules.pet.appointment.dto;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentInventoryConsumptionStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record PetAppointmentServiceLineInventoryActualRequest(
        @NotNull UUID inventoryItemId,
        BigDecimal actualQuantity,
        @NotNull PetAppointmentInventoryConsumptionStatus consumptionStatus
) {
}

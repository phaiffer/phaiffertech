package com.phaiffertech.platform.modules.pet.appointment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record PetAppointmentServiceLineInventoryActualUpdateRequest(
        @NotNull List<@Valid PetAppointmentServiceLineInventoryActualRequest> inventoryConsumptions
) {
}

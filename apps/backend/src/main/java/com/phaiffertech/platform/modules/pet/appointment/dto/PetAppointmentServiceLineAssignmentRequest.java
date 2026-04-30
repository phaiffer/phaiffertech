package com.phaiffertech.platform.modules.pet.appointment.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PetAppointmentServiceLineAssignmentRequest(
        @NotNull UUID serviceId,
        UUID professionalId
) {
}

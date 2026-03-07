package com.phaiffertech.platform.modules.pet.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record PetAppointmentUpdateRequest(
        @NotNull UUID clientId,
        @NotNull UUID petId,
        @NotNull Instant scheduledAt,
        @NotBlank String serviceName,
        @NotBlank String status,
        String notes,
        UUID assignedUserId
) {
}

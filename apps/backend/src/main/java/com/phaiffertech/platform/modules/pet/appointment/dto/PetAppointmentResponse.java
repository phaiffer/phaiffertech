package com.phaiffertech.platform.modules.pet.appointment.dto;

import java.time.Instant;
import java.util.UUID;

public record PetAppointmentResponse(
        UUID id,
        UUID clientId,
        UUID petId,
        UUID serviceId,
        String serviceName,
        UUID professionalId,
        Instant scheduledAt,
        String status,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}

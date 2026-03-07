package com.phaiffertech.platform.modules.pet.appointment.dto;

import java.time.Instant;
import java.util.UUID;

public record PetAppointmentResponse(
        UUID id,
        UUID clientId,
        UUID petId,
        Instant scheduledAt,
        String serviceName,
        String status,
        String notes,
        UUID assignedUserId,
        Instant createdAt,
        Instant updatedAt
) {
}

package com.phaiffertech.platform.modules.pet.appointment.dto;

import java.time.Instant;
import java.util.UUID;

public record PetAppointmentResponse(
        UUID id,
        UUID clientId,
        String clientName,
        UUID petId,
        String petName,
        UUID serviceId,
        String serviceName,
        UUID professionalId,
        String professionalName,
        Instant scheduledAt,
        String status,
        String notes,
        int medicalRecordCount,
        int vaccinationCount,
        int prescriptionCount,
        Instant createdAt,
        Instant updatedAt
) {
}

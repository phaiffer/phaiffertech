package com.phaiffertech.platform.modules.pet.appointment.dto;

import java.math.BigDecimal;
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
        Instant updatedAt,
        // Price snapshot from the service catalog at booking time.
        BigDecimal servicePrice,
        // Reserved for future commission calculation. Null until commission model exists.
        BigDecimal commissionAmount,
        // Plan integration fields.
        UUID clientPlanId,
        boolean planSessionConsumed,
        // Null when no plan is linked. Populated from the plan state at response time.
        Integer planRemainingSessions
) {
}

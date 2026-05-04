package com.phaiffertech.platform.modules.pet.billing.dto;

import java.util.UUID;

public record PetPreparedCustomerMessageResponse(
        String type,
        UUID tenantId,
        UUID clientId,
        String clientName,
        String clientEmail,
        String clientPhone,
        UUID petId,
        String petName,
        UUID planId,
        String planName,
        Integer remainingSessions,
        UUID appointmentId,
        String subject,
        String message,
        String pixKey,
        String billingDisplayName,
        boolean pixConfigured,
        boolean eligible,
        String safetyNote
) {
}

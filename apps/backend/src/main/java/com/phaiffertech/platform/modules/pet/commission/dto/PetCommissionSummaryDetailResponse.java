package com.phaiffertech.platform.modules.pet.commission.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetCommissionSummaryDetailResponse(
        UUID appointmentId,
        UUID appointmentServiceLineId,
        Instant scheduledAt,
        String appointmentStatus,
        UUID clientId,
        String clientName,
        UUID petId,
        String petName,
        UUID serviceId,
        String serviceName,
        int lineOrder,
        UUID professionalId,
        String professionalName,
        BigDecimal basePrice,
        Boolean commissionEligible,
        BigDecimal commissionRate,
        BigDecimal commissionAmount,
        String lineStatus,
        String dataSource
) {
}

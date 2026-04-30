package com.phaiffertech.platform.modules.pet.commission.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PetCommissionSummaryResponse(
        Instant scheduledFrom,
        Instant scheduledTo,
        String appointmentStatus,
        BigDecimal totalCommissionAmount,
        int professionalCount,
        int generatedLineCount,
        int excludedLineCount,
        int eligibleWithoutAmountLineCount,
        int unassignedLineCount,
        int legacyLineCount,
        int contributingAppointmentCount,
        List<PetCommissionSummaryProfessionalResponse> professionals,
        List<PetCommissionSummaryDetailResponse> details
) {
}

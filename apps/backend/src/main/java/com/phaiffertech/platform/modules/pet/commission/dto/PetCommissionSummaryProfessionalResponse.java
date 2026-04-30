package com.phaiffertech.platform.modules.pet.commission.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PetCommissionSummaryProfessionalResponse(
        UUID professionalId,
        String professionalName,
        BigDecimal totalCommissionAmount,
        int generatedLineCount,
        int excludedLineCount,
        int eligibleWithoutAmountLineCount,
        int contributingAppointmentCount
) {
}

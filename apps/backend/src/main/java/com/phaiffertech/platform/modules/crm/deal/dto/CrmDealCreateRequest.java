package com.phaiffertech.platform.modules.crm.deal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CrmDealCreateRequest(
        @NotBlank String title,
        String description,
        BigDecimal amount,
        String currency,
        String status,
        @NotNull UUID companyId,
        @NotNull UUID pipelineStageId,
        UUID contactId,
        UUID leadId,
        UUID ownerUserId,
        LocalDate expectedCloseDate
) {
}

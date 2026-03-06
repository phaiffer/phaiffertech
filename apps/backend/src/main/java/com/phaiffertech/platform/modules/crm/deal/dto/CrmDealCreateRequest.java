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
        String status,
        @NotNull UUID pipelineId,
        UUID stageId,
        UUID contactId,
        UUID leadId,
        UUID ownerUserId,
        LocalDate expectedCloseDate
) {
}

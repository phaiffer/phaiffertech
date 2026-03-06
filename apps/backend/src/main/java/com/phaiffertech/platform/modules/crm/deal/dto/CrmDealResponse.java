package com.phaiffertech.platform.modules.crm.deal.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CrmDealResponse(
        UUID id,
        String title,
        String description,
        BigDecimal amount,
        String status,
        UUID pipelineId,
        UUID stageId,
        UUID contactId,
        UUID leadId,
        UUID ownerUserId,
        LocalDate expectedCloseDate,
        Instant createdAt,
        Instant updatedAt
) {
}

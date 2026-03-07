package com.phaiffertech.platform.modules.crm.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CrmTaskUpdateRequest(
        @NotBlank String title,
        String description,
        Instant dueDate,
        @NotBlank String status,
        String priority,
        UUID assignedUserId,
        UUID companyId,
        UUID contactId,
        UUID leadId,
        UUID dealId,
        String relatedType,
        UUID relatedId
) {
}

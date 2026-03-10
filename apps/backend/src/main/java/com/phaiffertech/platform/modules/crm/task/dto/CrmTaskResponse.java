package com.phaiffertech.platform.modules.crm.task.dto;

import java.time.Instant;
import java.util.UUID;

public record CrmTaskResponse(
        UUID id,
        String title,
        String description,
        Instant dueDate,
        String status,
        String priority,
        UUID assignedUserId,
        UUID companyId,
        UUID contactId,
        UUID leadId,
        UUID dealId,
        String relatedType,
        String relatedReferenceType,
        String relatedModule,
        String relatedEntityType,
        UUID relatedId,
        String relatedDisplayName,
        String relatedDisplayContext,
        Instant createdAt,
        Instant updatedAt
) {
}

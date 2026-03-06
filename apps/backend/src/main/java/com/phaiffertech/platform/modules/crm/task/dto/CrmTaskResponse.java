package com.phaiffertech.platform.modules.crm.task.dto;

import java.time.Instant;
import java.util.UUID;

public record CrmTaskResponse(
        UUID id,
        String title,
        String description,
        Instant dueDate,
        String status,
        UUID assignedUserId,
        String relatedType,
        UUID relatedId,
        Instant createdAt,
        Instant updatedAt
) {
}

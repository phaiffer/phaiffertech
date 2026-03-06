package com.phaiffertech.platform.modules.crm.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CrmTaskCreateRequest(
        @NotBlank String title,
        String description,
        Instant dueDate,
        String status,
        UUID assignedUserId,
        @NotBlank String relatedType,
        @NotNull UUID relatedId
) {
}

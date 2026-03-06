package com.phaiffertech.platform.modules.crm.lead.dto;

import java.time.Instant;
import java.util.UUID;

public record CrmLeadResponse(
        UUID id,
        String name,
        String email,
        String phone,
        String source,
        String status,
        UUID assignedUserId,
        Instant createdAt,
        Instant updatedAt
) {
}

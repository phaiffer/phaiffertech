package com.phaiffertech.platform.modules.crm.note.dto;

import java.time.Instant;
import java.util.UUID;

public record CrmNoteResponse(
        UUID id,
        String content,
        UUID companyId,
        UUID contactId,
        UUID leadId,
        UUID dealId,
        String relatedType,
        UUID relatedId,
        UUID authorUserId,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}

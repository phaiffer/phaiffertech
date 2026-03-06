package com.phaiffertech.platform.modules.crm.note.dto;

import java.time.Instant;
import java.util.UUID;

public record CrmNoteResponse(
        UUID id,
        String content,
        String relatedType,
        UUID relatedId,
        UUID authorUserId,
        Instant createdAt,
        Instant updatedAt
) {
}

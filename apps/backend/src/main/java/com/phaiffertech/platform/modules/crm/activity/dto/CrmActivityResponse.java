package com.phaiffertech.platform.modules.crm.activity.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record CrmActivityResponse(
        UUID id,
        String eventType,
        String entity,
        String entityReferenceType,
        String entityModule,
        String entityType,
        String entityId,
        String relatedType,
        String relatedReferenceType,
        String relatedModule,
        String relatedEntityType,
        String relatedId,
        String relatedDisplayName,
        String relatedDisplayContext,
        UUID userId,
        JsonNode payload,
        Instant createdAt
) {
}

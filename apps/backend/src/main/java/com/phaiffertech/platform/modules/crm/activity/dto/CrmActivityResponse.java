package com.phaiffertech.platform.modules.crm.activity.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record CrmActivityResponse(
        UUID id,
        String eventType,
        String entity,
        String entityId,
        UUID userId,
        JsonNode payload,
        Instant createdAt
) {
}

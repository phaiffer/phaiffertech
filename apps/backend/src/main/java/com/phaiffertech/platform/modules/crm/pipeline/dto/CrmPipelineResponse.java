package com.phaiffertech.platform.modules.crm.pipeline.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CrmPipelineResponse(
        UUID id,
        String name,
        boolean isDefault,
        List<CrmPipelineStageResponse> stages,
        Instant createdAt,
        Instant updatedAt
) {
}

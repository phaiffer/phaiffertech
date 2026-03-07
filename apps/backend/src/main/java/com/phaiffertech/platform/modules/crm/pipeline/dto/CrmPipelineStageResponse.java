package com.phaiffertech.platform.modules.crm.pipeline.dto;

import java.util.UUID;

public record CrmPipelineStageResponse(
        UUID id,
        String name,
        String code,
        int position,
        String color,
        boolean isDefault
) {
}

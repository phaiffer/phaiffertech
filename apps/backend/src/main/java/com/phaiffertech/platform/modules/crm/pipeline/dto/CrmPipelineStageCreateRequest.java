package com.phaiffertech.platform.modules.crm.pipeline.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CrmPipelineStageCreateRequest(
        @NotBlank String name,
        @Min(1) Integer sortOrder
) {
}

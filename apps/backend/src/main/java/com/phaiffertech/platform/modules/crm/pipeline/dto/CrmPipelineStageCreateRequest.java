package com.phaiffertech.platform.modules.crm.pipeline.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CrmPipelineStageCreateRequest(
        @NotBlank String name,
        String code,
        @Min(1) Integer position,
        String color,
        Boolean isDefault
) {
}

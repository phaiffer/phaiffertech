package com.phaiffertech.platform.modules.crm.pipeline.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CrmPipelineCreateRequest(
        @NotBlank String name,
        Boolean isDefault,
        @Valid List<CrmPipelineStageCreateRequest> stages
) {
}

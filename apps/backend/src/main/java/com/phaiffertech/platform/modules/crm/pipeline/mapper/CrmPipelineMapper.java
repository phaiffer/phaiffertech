package com.phaiffertech.platform.modules.crm.pipeline.mapper;

import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipeline;
import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipelineStage;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineResponse;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineStageResponse;
import java.util.List;

public final class CrmPipelineMapper {

    private CrmPipelineMapper() {
    }

    public static CrmPipelineResponse toResponse(CrmPipeline pipeline, List<CrmPipelineStage> stages) {
        List<CrmPipelineStageResponse> stageResponses = stages.stream()
                .map(CrmPipelineMapper::toStageResponse)
                .toList();

        return new CrmPipelineResponse(
                pipeline.getId(),
                pipeline.getName(),
                pipeline.isDefaultPipeline(),
                stageResponses,
                pipeline.getCreatedAt(),
                pipeline.getUpdatedAt()
        );
    }

    public static CrmPipelineStageResponse toStageResponse(CrmPipelineStage stage) {
        return new CrmPipelineStageResponse(stage.getId(), stage.getName(), stage.getSortOrder());
    }
}

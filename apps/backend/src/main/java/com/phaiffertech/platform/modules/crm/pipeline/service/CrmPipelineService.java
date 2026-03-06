package com.phaiffertech.platform.modules.crm.pipeline.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipeline;
import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipelineStage;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineCreateRequest;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineResponse;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineStageCreateRequest;
import com.phaiffertech.platform.modules.crm.pipeline.mapper.CrmPipelineMapper;
import com.phaiffertech.platform.modules.crm.pipeline.repository.CrmPipelineRepository;
import com.phaiffertech.platform.modules.crm.pipeline.repository.CrmPipelineStageRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmPipelineService {

    private final CrmPipelineRepository pipelineRepository;
    private final CrmPipelineStageRepository stageRepository;

    public CrmPipelineService(CrmPipelineRepository pipelineRepository, CrmPipelineStageRepository stageRepository) {
        this.pipelineRepository = pipelineRepository;
        this.stageRepository = stageRepository;
    }

    @Transactional(readOnly = true)
    public List<CrmPipelineResponse> list() {
        UUID tenantId = TenantContext.getRequiredTenantId();
        List<CrmPipeline> pipelines = pipelineRepository.findAllByTenantIdOrderByCreatedAtAsc(tenantId);

        Map<UUID, List<CrmPipelineStage>> stagesByPipeline = pipelines.stream()
                .collect(Collectors.toMap(
                        CrmPipeline::getId,
                        pipeline -> stageRepository.findAllByTenantIdAndPipelineIdOrderBySortOrderAsc(tenantId, pipeline.getId())
                ));

        return pipelines.stream()
                .map(pipeline -> CrmPipelineMapper.toResponse(pipeline, stagesByPipeline.getOrDefault(pipeline.getId(), List.of())))
                .toList();
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_pipeline")
    public CrmPipelineResponse create(CrmPipelineCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        boolean markAsDefault = Boolean.TRUE.equals(request.isDefault());
        if (markAsDefault) {
            pipelineRepository.clearDefaultByTenantId(tenantId);
        }

        CrmPipeline pipeline = new CrmPipeline();
        pipeline.setTenantId(tenantId);
        pipeline.setName(request.name().trim());
        pipeline.setDefaultPipeline(markAsDefault);
        pipeline = pipelineRepository.save(pipeline);

        List<CrmPipelineStageCreateRequest> requestedStages = request.stages();
        if (requestedStages == null || requestedStages.isEmpty()) {
            requestedStages = List.of(new CrmPipelineStageCreateRequest("NEW", 1));
        }
        UUID pipelineId = pipeline.getId();
        List<CrmPipelineStageCreateRequest> stageRequests = requestedStages;

        List<CrmPipelineStage> stages = stageRequests.stream()
                .map(stageRequest -> buildStage(tenantId, pipelineId, stageRequest))
                .map(stageRepository::save)
                .sorted((left, right) -> Integer.compare(left.getSortOrder(), right.getSortOrder()))
                .toList();

        return CrmPipelineMapper.toResponse(pipeline, stages);
    }

    private CrmPipelineStage buildStage(UUID tenantId, UUID pipelineId, CrmPipelineStageCreateRequest request) {
        CrmPipelineStage stage = new CrmPipelineStage();
        stage.setTenantId(tenantId);
        stage.setPipelineId(pipelineId);
        stage.setName(request.name().trim().toUpperCase());
        stage.setSortOrder(request.sortOrder());
        return stage;
    }
}

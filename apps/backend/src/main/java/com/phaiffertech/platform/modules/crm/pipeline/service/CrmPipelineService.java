package com.phaiffertech.platform.modules.crm.pipeline.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipeline;
import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipelineStage;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineStageCreateRequest;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineStageResponse;
import com.phaiffertech.platform.modules.crm.pipeline.dto.CrmPipelineStageUpdateRequest;
import com.phaiffertech.platform.modules.crm.pipeline.mapper.CrmPipelineMapper;
import com.phaiffertech.platform.modules.crm.pipeline.repository.CrmPipelineRepository;
import com.phaiffertech.platform.modules.crm.pipeline.repository.CrmPipelineStageRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
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
    public PageResponseDto<CrmPipelineStageResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmPipelineStageResponse> result = stageRepository.findAllByTenantIdAndSearch(
                        tenantId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.ASC, "position"))
                )
                .map(CrmPipelineMapper::toStageResponse);
        return PaginationUtils.fromPage(result);
    }

    @Transactional(readOnly = true)
    public CrmPipelineStageResponse getById(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        return CrmPipelineMapper.toStageResponse(stageRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline stage not found.")));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_pipeline_stage")
    public CrmPipelineStageResponse create(CrmPipelineStageCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        validateUniqueness(tenantId, request.name(), request.code(), request.position(), null);
        CrmPipeline pipeline = ensureDefaultPipeline(tenantId);

        CrmPipelineStage stage = new CrmPipelineStage();
        stage.setTenantId(tenantId);
        stage.setPipelineId(pipeline.getId());
        apply(stage, request.name(), request.code(), request.position(), request.color(), Boolean.TRUE.equals(request.isDefault()));
        stage = stageRepository.save(stage);
        syncDefaultStage(tenantId, stage);
        return CrmPipelineMapper.toStageResponse(stage);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_pipeline_stage")
    public CrmPipelineStageResponse update(UUID id, CrmPipelineStageUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmPipelineStage stage = stageRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline stage not found."));

        validateUniqueness(tenantId, request.name(), request.code(), request.position(), id);
        apply(stage, request.name(), request.code(), request.position(), request.color(), Boolean.TRUE.equals(request.isDefault()));
        stage = stageRepository.save(stage);
        syncDefaultStage(tenantId, stage);
        return CrmPipelineMapper.toStageResponse(stage);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_pipeline_stage")
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmPipelineStage stage = stageRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline stage not found."));

        stage.setDeletedAt(java.time.Instant.now());
        stageRepository.save(stage);

        if (stage.isDefaultStage()) {
            stageRepository.findFirstByTenantIdOrderByPositionAsc(tenantId)
                    .filter(candidate -> !candidate.getId().equals(stage.getId()))
                    .ifPresent(candidate -> {
                        candidate.setDefaultStage(true);
                        stageRepository.save(candidate);
                    });
        }
    }

    private void apply(CrmPipelineStage stage, String name, String code, Integer position, String color, boolean defaultStage) {
        stage.setName(name.trim());
        stage.setCode(resolveCode(code, name));
        stage.setPosition(position);
        stage.setColor(resolveColor(color));
        stage.setDefaultStage(defaultStage);
    }

    private void validateUniqueness(UUID tenantId, String name, String code, Integer position, UUID currentId) {
        if (position == null || position < 1) {
            throw new IllegalArgumentException("Pipeline stage position must be greater than zero.");
        }

        boolean positionExists = currentId == null
                ? stageRepository.existsByTenantIdAndPosition(tenantId, position)
                : stageRepository.existsByTenantIdAndPositionAndIdNot(tenantId, position, currentId);
        if (positionExists) {
            throw new IllegalArgumentException("Pipeline stage position already exists.");
        }

        String resolvedCode = resolveCode(code, name);
        boolean codeExists = currentId == null
                ? stageRepository.existsByTenantIdAndCodeIgnoreCase(tenantId, resolvedCode)
                : stageRepository.existsByTenantIdAndCodeIgnoreCaseAndIdNot(tenantId, resolvedCode, currentId);
        if (codeExists) {
            throw new IllegalArgumentException("Pipeline stage code already exists.");
        }
    }

    private void syncDefaultStage(UUID tenantId, CrmPipelineStage stage) {
        if (stage.isDefaultStage()) {
            stageRepository.clearDefaultByTenantIdExcept(tenantId, stage.getId());
            return;
        }

        boolean hasDefault = stageRepository.findAllByTenantIdOrderByPositionAsc(tenantId)
                .stream()
                .anyMatch(CrmPipelineStage::isDefaultStage);
        if (!hasDefault) {
            stage.setDefaultStage(true);
            stageRepository.save(stage);
        }
    }

    private CrmPipeline ensureDefaultPipeline(UUID tenantId) {
        return pipelineRepository.findFirstByTenantIdAndDefaultPipelineTrueOrderByCreatedAtAsc(tenantId)
                .orElseGet(() -> {
                    CrmPipeline pipeline = new CrmPipeline();
                    pipeline.setTenantId(tenantId);
                    pipeline.setName("Default Pipeline");
                    pipeline.setDefaultPipeline(true);
                    return pipelineRepository.save(pipeline);
                });
    }

    private String resolveCode(String code, String fallbackName) {
        String raw = code == null || code.isBlank() ? fallbackName : code;
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Pipeline stage code is required.");
        }
        return raw.trim().toUpperCase().replace(' ', '_');
    }

    private String resolveColor(String color) {
        if (color == null || color.isBlank()) {
            return "#475569";
        }
        return color.trim();
    }
}

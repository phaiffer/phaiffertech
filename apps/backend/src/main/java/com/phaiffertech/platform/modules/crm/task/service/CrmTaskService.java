package com.phaiffertech.platform.modules.crm.task.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.shared.service.CrmRelationResolverService;
import com.phaiffertech.platform.modules.crm.task.domain.CrmTask;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskCreateRequest;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskResponse;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskUpdateRequest;
import com.phaiffertech.platform.modules.crm.task.mapper.CrmTaskMapper;
import com.phaiffertech.platform.modules.crm.task.repository.CrmTaskRepository;
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
public class CrmTaskService {

    private final CrmTaskRepository repository;
    private final CrmRelationResolverService relationResolverService;

    public CrmTaskService(CrmTaskRepository repository, CrmRelationResolverService relationResolverService) {
        this.repository = repository;
        this.relationResolverService = relationResolverService;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmTaskResponse> list(
            PageRequestDto pageRequest,
            String status,
            String priority,
            UUID assignedUserId,
            UUID companyId,
            UUID contactId,
            UUID leadId,
            UUID dealId
    ) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmTaskResponse> result = repository.findAllByTenantAndSearch(
                        tenantId,
                        normalizeUpper(status),
                        normalizeUpper(priority),
                        assignedUserId,
                        companyId,
                        contactId,
                        leadId,
                        dealId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "dueDate"))
                )
                .map(CrmTaskMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    @Transactional(readOnly = true)
    public CrmTaskResponse getById(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        return CrmTaskMapper.toResponse(repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found.")));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_task")
    public CrmTaskResponse create(CrmTaskCreateRequest request) {
        CrmTask task = new CrmTask();
        task.setTenantId(TenantContext.getRequiredTenantId());
        apply(task, request);
        return CrmTaskMapper.toResponse(repository.save(task));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_task")
    public CrmTaskResponse update(UUID id, CrmTaskUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmTask task = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));
        apply(task, request);
        return CrmTaskMapper.toResponse(repository.save(task));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_task")
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmTask task = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));
        task.setDeletedAt(java.time.Instant.now());
        repository.save(task);
    }

    private void apply(CrmTask task, CrmTaskCreateRequest request) {
        var relation = relationResolverService.resolveAndValidate(
                TenantContext.getRequiredTenantId(),
                request.companyId(),
                request.contactId(),
                request.leadId(),
                request.dealId(),
                request.relatedType(),
                request.relatedId()
        );
        task.setTitle(request.title().trim());
        task.setDescription(normalize(request.description()));
        task.setDueDate(request.dueDate());
        task.setStatus(resolveStatus(request.status()));
        task.setPriority(resolvePriority(request.priority()));
        task.setAssignedUserId(request.assignedUserId());
        task.setRelatedType(relation.relatedType());
        task.setRelatedId(relation.relatedId());
        task.setCompanyId(relation.companyId());
        task.setContactId(relation.contactId());
        task.setLeadId(relation.leadId());
        task.setDealId(relation.dealId());
    }

    private void apply(CrmTask task, CrmTaskUpdateRequest request) {
        var relation = relationResolverService.resolveAndValidate(
                TenantContext.getRequiredTenantId(),
                request.companyId(),
                request.contactId(),
                request.leadId(),
                request.dealId(),
                request.relatedType(),
                request.relatedId()
        );
        task.setTitle(request.title().trim());
        task.setDescription(normalize(request.description()));
        task.setDueDate(request.dueDate());
        task.setStatus(resolveStatus(request.status()));
        task.setPriority(resolvePriority(request.priority()));
        task.setAssignedUserId(request.assignedUserId());
        task.setRelatedType(relation.relatedType());
        task.setRelatedId(relation.relatedId());
        task.setCompanyId(relation.companyId());
        task.setContactId(relation.contactId());
        task.setLeadId(relation.leadId());
        task.setDealId(relation.dealId());
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "OPEN";
        }
        return status.trim().toUpperCase();
    }

    private String resolvePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return "MEDIUM";
        }
        return priority.trim().toUpperCase();
    }

    private String normalizeUpper(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toUpperCase();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

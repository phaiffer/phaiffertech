package com.phaiffertech.platform.modules.crm.task.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
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

    public CrmTaskService(CrmTaskRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmTaskResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmTaskResponse> result = repository.findAllByTenantAndSearch(
                        tenantId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(CrmTaskMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_task")
    public CrmTaskResponse create(CrmTaskCreateRequest request) {
        CrmTask task = new CrmTask();
        task.setTenantId(TenantContext.getRequiredTenantId());
        apply(task, request.title(), request.description(), request.dueDate(), request.status(),
                request.assignedUserId(), request.relatedType(), request.relatedId());

        return CrmTaskMapper.toResponse(repository.save(task));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_task")
    public CrmTaskResponse update(UUID id, CrmTaskUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmTask task = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));

        apply(task, request.title(), request.description(), request.dueDate(), request.status(),
                request.assignedUserId(), request.relatedType(), request.relatedId());

        return CrmTaskMapper.toResponse(repository.save(task));
    }

    private void apply(
            CrmTask task,
            String title,
            String description,
            java.time.Instant dueDate,
            String status,
            UUID assignedUserId,
            String relatedType,
            UUID relatedId
    ) {
        task.setTitle(title.trim());
        task.setDescription(description);
        task.setDueDate(dueDate);
        task.setStatus(resolveStatus(status));
        task.setAssignedUserId(assignedUserId);
        task.setRelatedType(relatedType.trim().toUpperCase());
        task.setRelatedId(relatedId);
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "OPEN";
        }
        return status.trim().toUpperCase();
    }
}

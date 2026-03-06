package com.phaiffertech.platform.modules.crm.lead.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.lead.domain.CrmLead;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadCreateRequest;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadResponse;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadUpdateRequest;
import com.phaiffertech.platform.modules.crm.lead.mapper.CrmLeadMapper;
import com.phaiffertech.platform.modules.crm.lead.repository.CrmLeadRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmLeadService {

    private final CrmLeadRepository repository;

    public CrmLeadService(CrmLeadRepository repository) {
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_lead")
    public CrmLeadResponse create(CrmLeadCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        CrmLead lead = new CrmLead();
        lead.setTenantId(tenantId);
        lead.setName(request.name().trim());
        lead.setEmail(request.email());
        lead.setPhone(request.phone());
        lead.setSource(request.source());
        lead.setStatus(resolveStatus(request.status()));
        lead.setAssignedUserId(request.assignedUserId());

        return CrmLeadMapper.toResponse(repository.save(lead));
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmLeadResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmLeadResponse> result = repository.findAllByTenantIdAndSearch(
                        tenantId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(CrmLeadMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_lead")
    public CrmLeadResponse update(UUID id, CrmLeadUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmLead lead = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found."));

        lead.setName(request.name().trim());
        lead.setEmail(request.email());
        lead.setPhone(request.phone());
        lead.setSource(request.source());
        lead.setStatus(resolveStatus(request.status()));
        lead.setAssignedUserId(request.assignedUserId());

        return CrmLeadMapper.toResponse(repository.save(lead));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_lead")
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        CrmLead lead = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found."));

        lead.setDeletedAt(Instant.now());
        repository.save(lead);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "crm_lead")
    public CrmLeadResponse restore(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        CrmLead lead = repository.findByIdIncludingDeleted(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found."));

        lead.setDeletedAt(null);
        return CrmLeadMapper.toResponse(repository.save(lead));
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "NEW";
        }
        return status.trim().toUpperCase();
    }
}

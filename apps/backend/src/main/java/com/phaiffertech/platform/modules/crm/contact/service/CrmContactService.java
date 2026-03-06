package com.phaiffertech.platform.modules.crm.contact.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.contact.domain.CrmContact;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactCreateRequest;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactResponse;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactUpdateRequest;
import com.phaiffertech.platform.modules.crm.contact.mapper.CrmContactMapper;
import com.phaiffertech.platform.modules.crm.contact.repository.CrmContactRepository;
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
public class CrmContactService {

    private final CrmContactRepository repository;

    public CrmContactService(CrmContactRepository repository) {
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_contact")
    public CrmContactResponse create(CrmContactCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        CrmContact contact = new CrmContact();
        contact.setTenantId(tenantId);
        contact.setFirstName(request.firstName().trim());
        contact.setLastName(request.lastName());
        contact.setEmail(request.email());
        contact.setPhone(request.phone());
        contact.setCompany(request.company());
        contact.setStatus(resolveStatus(request.status()));
        contact.setOwnerUserId(request.ownerUserId());

        return CrmContactMapper.toResponse(repository.save(contact));
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmContactResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmContactResponse> result = repository.findAllByTenantIdAndSearch(
                        tenantId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(CrmContactMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }

    @Transactional(readOnly = true)
    public CrmContactResponse getById(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmContact contact = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found."));

        return CrmContactMapper.toResponse(contact);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_contact")
    public CrmContactResponse update(UUID id, CrmContactUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        CrmContact contact = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found."));

        contact.setFirstName(request.firstName().trim());
        contact.setLastName(request.lastName());
        contact.setEmail(request.email());
        contact.setPhone(request.phone());
        contact.setCompany(request.company());
        contact.setStatus(resolveStatus(request.status()));
        contact.setOwnerUserId(request.ownerUserId());

        return CrmContactMapper.toResponse(repository.save(contact));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_contact")
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        CrmContact contact = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found."));

        contact.setDeletedAt(Instant.now());
        repository.save(contact);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "crm_contact")
    public CrmContactResponse restore(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        CrmContact contact = repository.findByIdIncludingDeleted(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found."));

        contact.setDeletedAt(null);
        return CrmContactMapper.toResponse(repository.save(contact));
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return status.trim().toUpperCase();
    }
}

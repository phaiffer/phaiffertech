package com.phaiffertech.platform.modules.crm.company.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.crm.company.domain.CrmCompany;
import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyCreateRequest;
import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyResponse;
import com.phaiffertech.platform.modules.crm.company.dto.CrmCompanyUpdateRequest;
import com.phaiffertech.platform.modules.crm.company.mapper.CrmCompanyMapper;
import com.phaiffertech.platform.modules.crm.company.repository.CrmCompanyRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
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
public class CrmCompanyService {

    private final CrmCompanyRepository repository;

    public CrmCompanyService(CrmCompanyRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<CrmCompanyResponse> list(PageRequestDto pageRequest, String status, UUID ownerUserId) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmCompanyResponse> result = repository.findAllByTenantIdAndSearch(
                        tenantId,
                        normalizeUpper(status),
                        ownerUserId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "updatedAt"))
                )
                .map(CrmCompanyMapper::toResponse);
        return PaginationUtils.fromPage(result);
    }

    @Transactional(readOnly = true)
    public CrmCompanyResponse getById(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        return CrmCompanyMapper.toResponse(
                repository.findByIdAndTenantId(id, tenantId)
                        .orElseThrow(() -> new com.phaiffertech.platform.shared.exception.ResourceNotFoundException("Company not found."))
        );
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "crm_company")
    public CrmCompanyResponse create(CrmCompanyCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        validateUniqueness(tenantId, request.email(), request.document(), null);

        CrmCompany company = CrmCompanyMapper.toEntity(request);
        company.setTenantId(tenantId);
        return CrmCompanyMapper.toResponse(repository.save(company));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "crm_company")
    public CrmCompanyResponse update(UUID id, CrmCompanyUpdateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmCompany company = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new com.phaiffertech.platform.shared.exception.ResourceNotFoundException("Company not found."));

        validateUniqueness(tenantId, request.email(), request.document(), id);
        CrmCompanyMapper.apply(company, request);
        return CrmCompanyMapper.toResponse(repository.save(company));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "crm_company")
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CrmCompany company = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new com.phaiffertech.platform.shared.exception.ResourceNotFoundException("Company not found."));
        company.setDeletedAt(java.time.Instant.now());
        repository.save(company);
    }

    @Transactional(readOnly = true)
    public CrmCompany requireActiveCompany(UUID tenantId, UUID companyId) {
        if (companyId == null) {
            throw new IllegalArgumentException("Company reference is required.");
        }
        return repository.findByIdAndTenantId(companyId, tenantId)
                .orElseThrow(() -> new com.phaiffertech.platform.shared.exception.ResourceNotFoundException("Company not found."));
    }

    @Transactional(readOnly = true)
    public java.util.Optional<CrmCompany> findActiveCompany(UUID tenantId, UUID companyId) {
        if (companyId == null) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(companyId, tenantId);
    }

    private void validateUniqueness(UUID tenantId, String email, String document, UUID currentId) {
        String normalizedEmail = normalize(email);
        if (normalizedEmail != null) {
            boolean exists = currentId == null
                    ? repository.existsByTenantIdAndEmailIgnoreCaseAndDeletedAtIsNull(tenantId, normalizedEmail)
                    : repository.existsByTenantIdAndEmailIgnoreCaseAndIdNotAndDeletedAtIsNull(tenantId, normalizedEmail, currentId);
            if (exists) {
                throw new IllegalArgumentException("Company email already exists.");
            }
        }

        String normalizedDocument = normalize(document);
        if (normalizedDocument != null) {
            boolean exists = currentId == null
                    ? repository.existsByTenantIdAndDocumentIgnoreCaseAndDeletedAtIsNull(tenantId, normalizedDocument)
                    : repository.existsByTenantIdAndDocumentIgnoreCaseAndIdNotAndDeletedAtIsNull(tenantId, normalizedDocument, currentId);
            if (exists) {
                throw new IllegalArgumentException("Company document already exists.");
            }
        }
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

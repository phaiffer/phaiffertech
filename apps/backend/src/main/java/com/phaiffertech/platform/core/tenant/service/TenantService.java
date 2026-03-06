package com.phaiffertech.platform.core.tenant.service;

import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.dto.TenantCreateRequest;
import com.phaiffertech.platform.core.tenant.dto.TenantResponse;
import com.phaiffertech.platform.core.tenant.mapper.TenantMapper;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "tenant")
    public TenantResponse create(TenantCreateRequest request) {
        if (tenantRepository.existsByCodeIgnoreCase(request.code())) {
            throw new IllegalArgumentException("Tenant code already exists.");
        }

        Tenant tenant = new Tenant();
        tenant.setName(request.name());
        tenant.setCode(request.code().toLowerCase());
        tenant.setStatus("ACTIVE");
        tenant = tenantRepository.save(tenant);

        return TenantMapper.toResponse(tenant);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<TenantResponse> list(PageRequestDto pageRequest) {
        Page<TenantResponse> result = tenantRepository.findAll(
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.ASC, "name")))
                .map(TenantMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }
}

package com.phaiffertech.platform.core.tenant.service;

import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.dto.TenantCreateRequest;
import com.phaiffertech.platform.core.tenant.dto.TenantResponse;
import com.phaiffertech.platform.core.tenant.mapper.TenantMapper;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.shared.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Transactional
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
    public PageResponse<TenantResponse> list(int page, int size) {
        Page<Tenant> result = tenantRepository.findAll(PageRequest.of(page, size));
        return new PageResponse<>(
                result.getContent().stream().map(TenantMapper::toResponse).toList(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize()
        );
    }
}

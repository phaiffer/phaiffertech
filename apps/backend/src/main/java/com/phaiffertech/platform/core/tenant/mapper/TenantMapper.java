package com.phaiffertech.platform.core.tenant.mapper;

import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.dto.TenantResponse;

public final class TenantMapper {

    private TenantMapper() {
    }

    public static TenantResponse toResponse(Tenant tenant) {
        return new TenantResponse(tenant.getId(), tenant.getName(), tenant.getCode(), tenant.getStatus());
    }
}

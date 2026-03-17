package com.phaiffertech.platform.core.tenant.mapper;

import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.dto.TenantResponse;
import java.util.List;

public final class TenantMapper {

    private TenantMapper() {
    }

    public static TenantResponse toResponse(Tenant tenant, List<String> contractedModules, List<String> featureEntitlements) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getCode(),
                tenant.getStatus(),
                tenant.getPlanCode(),
                tenant.isPlatformOwner(),
                tenant.getLogoUrl(),
                tenant.getPrimaryColor(),
                tenant.getAccentColor(),
                tenant.getDefaultThemeMode(),
                tenant.isAllowUserThemeOverride(),
                contractedModules,
                featureEntitlements
        );
    }
}

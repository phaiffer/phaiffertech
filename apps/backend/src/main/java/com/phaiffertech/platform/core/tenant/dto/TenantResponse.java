package com.phaiffertech.platform.core.tenant.dto;

import com.phaiffertech.platform.core.tenant.domain.TenantThemeMode;
import java.util.List;
import java.util.UUID;

public record TenantResponse(
        UUID id,
        String name,
        String code,
        String status,
        String planCode,
        boolean platformOwner,
        String logoUrl,
        String primaryColor,
        String accentColor,
        TenantThemeMode defaultThemeMode,
        boolean allowUserThemeOverride,
        List<String> contractedModules,
        List<String> featureEntitlements,
        List<String> moduleOverrides,
        List<String> effectiveFeatureEntitlements
) {
}

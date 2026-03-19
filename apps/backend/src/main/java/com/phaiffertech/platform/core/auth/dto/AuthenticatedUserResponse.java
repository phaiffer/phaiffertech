package com.phaiffertech.platform.core.auth.dto;

import com.phaiffertech.platform.core.tenant.domain.TenantThemeMode;
import java.util.List;
import java.util.UUID;
import java.util.Set;

public record AuthenticatedUserResponse(
        UUID userId,
        String email,
        String fullName,
        UUID tenantId,
        String tenantName,
        String tenantCode,
        String tenantLogoUrl,
        String tenantPrimaryColor,
        String tenantAccentColor,
        TenantThemeMode tenantDefaultThemeMode,
        boolean tenantAllowUserThemeOverride,
        boolean platformOwner,
        boolean platformAdmin,
        String role,
        Set<String> roles,
        Set<String> permissions,
        List<String> featureEntitlements
) {
}

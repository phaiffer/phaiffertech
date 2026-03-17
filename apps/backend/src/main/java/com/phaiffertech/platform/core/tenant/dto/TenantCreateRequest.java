package com.phaiffertech.platform.core.tenant.dto;

import com.phaiffertech.platform.core.tenant.domain.TenantThemeMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record TenantCreateRequest(
        @NotBlank String name,
        @NotBlank String code,
        @Pattern(regexp = "^[A-Za-z0-9_-]{2,80}$", message = "Plan code must use letters, numbers, underscore or hyphen") String planCode,
        String logoUrl,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Primary color must use #RRGGBB format") String primaryColor,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Accent color must use #RRGGBB format") String accentColor,
        TenantThemeMode defaultThemeMode,
        Boolean allowUserThemeOverride,
        List<String> contractedModules,
        List<String> featureEntitlements
) {
}

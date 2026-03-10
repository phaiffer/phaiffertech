package com.phaiffertech.platform.core.auth.mapper;

import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.shared.domain.enums.RoleCode;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;

public final class AuthMapper {

    private AuthMapper() {
    }

    public static AuthenticatedUserResponse toAuthenticatedUserResponse(User user, AuthenticatedUser principal, Tenant tenant) {
        return new AuthenticatedUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                principal.tenantId(),
                tenant.getName(),
                tenant.getCode(),
                tenant.getLogoUrl(),
                tenant.getPrimaryColor(),
                tenant.getAccentColor(),
                tenant.getDefaultThemeMode(),
                tenant.isAllowUserThemeOverride(),
                tenant.isPlatformOwner(),
                isPlatformAdmin(principal, tenant),
                principal.role(),
                principal.roles(),
                principal.permissions()
        );
    }

    public static AuthenticatedUserResponse toAuthenticatedUserResponse(AuthenticatedUser principal, String fullName, Tenant tenant) {
        return new AuthenticatedUserResponse(
                principal.userId(),
                principal.email(),
                fullName,
                principal.tenantId(),
                tenant.getName(),
                tenant.getCode(),
                tenant.getLogoUrl(),
                tenant.getPrimaryColor(),
                tenant.getAccentColor(),
                tenant.getDefaultThemeMode(),
                tenant.isAllowUserThemeOverride(),
                tenant.isPlatformOwner(),
                isPlatformAdmin(principal, tenant),
                principal.role(),
                principal.roles(),
                principal.permissions()
        );
    }

    private static boolean isPlatformAdmin(AuthenticatedUser principal, Tenant tenant) {
        boolean hasPlatformRole = principal.roles() != null && !principal.roles().isEmpty()
                ? principal.roles().contains(RoleCode.PLATFORM_ADMIN.name())
                : RoleCode.PLATFORM_ADMIN.name().equals(principal.role());

        return hasPlatformRole && tenant.isPlatformOwner();
    }
}

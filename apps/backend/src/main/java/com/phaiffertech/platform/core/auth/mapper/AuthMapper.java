package com.phaiffertech.platform.core.auth.mapper;

import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.auth.dto.SupportImpersonationContextResponse;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.shared.domain.enums.RoleCode;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.security.SupportImpersonationDetails;
import java.util.List;

public final class AuthMapper {

    private AuthMapper() {
    }

    public static AuthenticatedUserResponse toAuthenticatedUserResponse(
            User user,
            AuthenticatedUser principal,
            Tenant tenant,
            List<String> featureEntitlements
    ) {
        return toAuthenticatedUserResponse(user, principal, tenant, featureEntitlements, null);
    }

    public static AuthenticatedUserResponse toAuthenticatedUserResponse(
            User user,
            AuthenticatedUser principal,
            Tenant tenant,
            List<String> featureEntitlements,
            SupportImpersonationContextResponse impersonation
    ) {
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
                principal.permissions(),
                featureEntitlements,
                impersonation
        );
    }

    public static AuthenticatedUserResponse toAuthenticatedUserResponse(
            AuthenticatedUser principal,
            String fullName,
            Tenant tenant,
            List<String> featureEntitlements
    ) {
        return toAuthenticatedUserResponse(principal, fullName, tenant, featureEntitlements, null);
    }

    public static AuthenticatedUserResponse toAuthenticatedUserResponse(
            AuthenticatedUser principal,
            String fullName,
            Tenant tenant,
            List<String> featureEntitlements,
            SupportImpersonationContextResponse impersonation
    ) {
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
                principal.permissions(),
                featureEntitlements,
                impersonation
        );
    }

    public static SupportImpersonationContextResponse toSupportImpersonationContextResponse(
            SupportImpersonationDetails impersonation,
            Tenant sourceTenant
    ) {
        if (impersonation == null || sourceTenant == null) {
            return null;
        }

        return new SupportImpersonationContextResponse(
                impersonation.sessionId(),
                sourceTenant.getId(),
                sourceTenant.getName(),
                sourceTenant.getCode(),
                impersonation.startedAt(),
                impersonation.expiresAt()
        );
    }

    private static boolean isPlatformAdmin(AuthenticatedUser principal, Tenant tenant) {
        boolean hasPlatformRole = principal.roles() != null && !principal.roles().isEmpty()
                ? principal.roles().contains(RoleCode.PLATFORM_ADMIN.name())
                : RoleCode.PLATFORM_ADMIN.name().equals(principal.role());

        return hasPlatformRole && tenant.isPlatformOwner();
    }
}

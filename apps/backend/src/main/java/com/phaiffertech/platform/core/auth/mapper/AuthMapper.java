package com.phaiffertech.platform.core.auth.mapper;

import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;

public final class AuthMapper {

    private AuthMapper() {
    }

    public static AuthenticatedUserResponse toAuthenticatedUserResponse(User user, AuthenticatedUser principal) {
        return new AuthenticatedUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                principal.tenantId(),
                principal.role(),
                principal.permissions()
        );
    }

    public static AuthenticatedUserResponse toAuthenticatedUserResponse(AuthenticatedUser principal, String fullName) {
        return new AuthenticatedUserResponse(
                principal.userId(),
                principal.email(),
                fullName,
                principal.tenantId(),
                principal.role(),
                principal.permissions()
        );
    }
}

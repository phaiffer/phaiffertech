package com.phaiffertech.platform.shared.security;

import org.springframework.stereotype.Service;

@Service
public class PermissionAuthorizationService {

    public boolean hasPermission(AuthenticatedUser user, String permission) {
        if (user == null || permission == null || permission.isBlank()) {
            return false;
        }

        if ((user.roles() != null && user.roles().contains("PLATFORM_ADMIN"))
                || "PLATFORM_ADMIN".equals(user.role())) {
            return true;
        }

        return user.permissions().contains(permission);
    }
}

package com.phaiffertech.platform.shared.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record AuthenticatedUser(
        UUID userId,
        UUID tenantId,
        String email,
        String role,
        Set<String> roles,
        Set<String> permissions,
        SupportImpersonationDetails impersonation
) {
    public AuthenticatedUser(
            UUID userId,
            UUID tenantId,
            String email,
            String role,
            Set<String> roles,
            Set<String> permissions
    ) {
        this(userId, tenantId, email, role, roles, permissions, null);
    }

    public Collection<? extends GrantedAuthority> authorities() {
        var grantedAuthorities = new ArrayList<GrantedAuthority>();
        if (roles != null && !roles.isEmpty()) {
            roles.forEach(roleCode -> grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + roleCode)));
        } else if (role != null && !role.isBlank()) {
            grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }

        if (permissions != null) {
            permissions.forEach(permission -> grantedAuthorities.add(new SimpleGrantedAuthority(permission)));
        }
        return grantedAuthorities;
    }

    public boolean isImpersonating() {
        return impersonation != null;
    }

    public UUID auditActorUserId() {
        return impersonation != null && impersonation.sourceUserId() != null
                ? impersonation.sourceUserId()
                : userId;
    }
}

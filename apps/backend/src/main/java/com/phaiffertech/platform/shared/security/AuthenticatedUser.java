package com.phaiffertech.platform.shared.security;

import java.util.Collection;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record AuthenticatedUser(
        UUID userId,
        UUID tenantId,
        String email,
        String role,
    Set<String> permissions
) {
    public Collection<? extends GrantedAuthority> authorities() {
        List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
        grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        if (permissions != null) {
            permissions.forEach(permission -> grantedAuthorities.add(new SimpleGrantedAuthority(permission)));
        }
        return grantedAuthorities;
    }
}

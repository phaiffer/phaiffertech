package com.phaiffertech.platform.shared.security;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class LocalDevelopmentAdministratorAccessService {

    private static final String DEV_PROFILE = "dev";
    private static final String LOCAL_SYSTEM_ADMIN_EMAIL = "admin@local.test";

    private final Environment environment;

    public LocalDevelopmentAdministratorAccessService(Environment environment) {
        this.environment = environment;
    }

    public boolean isEnabledForCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            return false;
        }

        return isEnabledForUser(user);
    }

    public boolean isEnabledForUser(AuthenticatedUser user) {
        return user != null && isEnabledForEmail(user.email());
    }

    public boolean isEnabledForEmail(String email) {
        return isDevelopmentProfileActive() && LOCAL_SYSTEM_ADMIN_EMAIL.equalsIgnoreCase(normalizeEmail(email));
    }

    private boolean isDevelopmentProfileActive() {
        return environment.acceptsProfiles(Profiles.of(DEV_PROFILE));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim();
    }
}

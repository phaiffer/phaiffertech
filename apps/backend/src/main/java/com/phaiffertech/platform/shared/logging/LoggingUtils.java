package com.phaiffertech.platform.shared.logging;

import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class LoggingUtils {

    public static final String TENANT_ID = "tenant_id";
    public static final String USER_ID = "user_id";
    public static final String TRACE_ID = "trace_id";
    public static final String SPAN_ID = "span_id";

    private LoggingUtils() {
    }

    public static String resolveTenantId() {
        try {
            UUID tenantId = TenantContext.getRequiredTenantId();
            return tenantId.toString();
        } catch (Exception ignored) {
            return resolveAuthenticatedUser().map(user -> user.tenantId().toString()).orElse("anonymous");
        }
    }

    public static String resolveUserId() {
        return resolveAuthenticatedUser().map(user -> user.userId().toString()).orElse("anonymous");
    }

    public static void populateTraceIdentifiers() {
        putIfPresent(TRACE_ID, MDC.get("traceId"));
        putIfPresent(SPAN_ID, MDC.get("spanId"));
    }

    public static void putIfPresent(String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        MDC.put(key, value);
    }

    private static Optional<AuthenticatedUser> resolveAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return Optional.empty();
        }
        if (authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }
}

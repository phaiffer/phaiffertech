package com.phaiffertech.platform.core.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record SupportImpersonationContextResponse(
        UUID sessionId,
        UUID sourceTenantId,
        String sourceTenantName,
        String sourceTenantCode,
        Instant startedAt,
        Instant expiresAt
) {
}

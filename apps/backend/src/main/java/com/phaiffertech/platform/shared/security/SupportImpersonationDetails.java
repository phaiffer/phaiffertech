package com.phaiffertech.platform.shared.security;

import java.time.Instant;
import java.util.UUID;

public record SupportImpersonationDetails(
        UUID sessionId,
        UUID sourceTenantId,
        UUID sourceUserId,
        Instant startedAt,
        Instant expiresAt
) {
}

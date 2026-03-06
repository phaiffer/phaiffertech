package com.phaiffertech.platform.core.auth.dto;

import java.util.UUID;
import java.util.Set;

public record AuthenticatedUserResponse(
        UUID userId,
        String email,
        String fullName,
        UUID tenantId,
        String role,
        Set<String> permissions
) {
}

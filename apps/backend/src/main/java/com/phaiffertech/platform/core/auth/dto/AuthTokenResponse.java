package com.phaiffertech.platform.core.auth.dto;

public record AuthTokenResponse(
        String accessToken,
        long expiresInSeconds,
        AuthenticatedUserResponse user
) {
}

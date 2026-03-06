package com.phaiffertech.platform.core.auth.dto;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken,
        long expiresInSeconds,
        AuthenticatedUserResponse user
) {
}

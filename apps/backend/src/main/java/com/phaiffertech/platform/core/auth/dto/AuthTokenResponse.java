package com.phaiffertech.platform.core.auth.dto;

public record AuthTokenResponse(
        String accessToken,
        long expiresInSeconds,
        AuthenticatedUserResponse user
) {

    @Override
    public String toString() {
        return "AuthTokenResponse[accessToken=%s, expiresInSeconds=%d, user=%s]"
                .formatted("[REDACTED]", expiresInSeconds, "[REDACTED]");
    }
}

package com.phaiffertech.platform.core.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(@NotBlank String refreshToken) {

    @Override
    public String toString() {
        return "LogoutRequest[refreshToken=%s]".formatted("[REDACTED]");
    }
}

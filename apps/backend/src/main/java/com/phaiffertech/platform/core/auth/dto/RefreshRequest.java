package com.phaiffertech.platform.core.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(@NotBlank String refreshToken) {

    @Override
    public String toString() {
        return "RefreshRequest[refreshToken=%s]".formatted("[REDACTED]");
    }
}

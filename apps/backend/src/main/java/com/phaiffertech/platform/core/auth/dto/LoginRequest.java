package com.phaiffertech.platform.core.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String tenantCode,
        @Email @NotBlank String email,
        @NotBlank String password
) {

    @Override
    public String toString() {
        return "LoginRequest[tenantCode=%s, email=%s, password=%s]".formatted(tenantCode, "[REDACTED]", "[REDACTED]");
    }
}

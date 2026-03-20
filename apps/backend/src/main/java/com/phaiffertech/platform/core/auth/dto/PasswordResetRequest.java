package com.phaiffertech.platform.core.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(
        @NotBlank String tenantCode,
        @Email @NotBlank String email
) {

    @Override
    public String toString() {
        return "PasswordResetRequest[tenantCode=%s, email=%s]".formatted(tenantCode, "[REDACTED]");
    }
}

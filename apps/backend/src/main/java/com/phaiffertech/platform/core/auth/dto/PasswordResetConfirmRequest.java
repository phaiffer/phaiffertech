package com.phaiffertech.platform.core.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 72, message = "New password must be between 8 and 72 characters.") String newPassword,
        @NotBlank String confirmNewPassword
) {

    @Override
    public String toString() {
        return "PasswordResetConfirmRequest[token=%s, newPassword=%s, confirmNewPassword=%s]"
                .formatted("[REDACTED]", "[REDACTED]", "[REDACTED]");
    }
}

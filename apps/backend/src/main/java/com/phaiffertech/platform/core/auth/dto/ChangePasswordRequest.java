package com.phaiffertech.platform.core.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8, max = 72, message = "New password must be between 8 and 72 characters.") String newPassword,
        @NotBlank String confirmNewPassword
) {
}

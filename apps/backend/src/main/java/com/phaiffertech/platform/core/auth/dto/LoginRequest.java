package com.phaiffertech.platform.core.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String tenantCode,
        @Email @NotBlank String email,
        @NotBlank String password
) {
}

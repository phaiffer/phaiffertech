package com.phaiffertech.platform.core.tenant.dto;

import jakarta.validation.constraints.NotBlank;

public record TenantCreateRequest(
        @NotBlank String name,
        @NotBlank String code
) {
}

package com.phaiffertech.platform.core.auth.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record SupportImpersonationStartRequest(
        @NotNull UUID targetTenantId,
        @NotBlank @Size(min = 10, max = 500) String reason,
        @Min(1) @Max(60) Integer durationMinutes
) {
}

package com.phaiffertech.platform.core.module.featureflag.dto;

import jakarta.validation.constraints.NotNull;

public record FeatureFlagUpdateRequest(
        @NotNull Boolean enabled
) {
}

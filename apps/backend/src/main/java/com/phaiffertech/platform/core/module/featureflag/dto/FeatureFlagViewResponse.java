package com.phaiffertech.platform.core.module.featureflag.dto;

public record FeatureFlagViewResponse(
        String key,
        boolean enabled,
        String scope
) {
}

package com.phaiffertech.platform.core.module.service;

public record ModuleAccessStatus(
        String moduleCode,
        boolean moduleEnabled,
        boolean featureFlagEnabled,
        boolean available
) {
}

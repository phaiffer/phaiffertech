package com.phaiffertech.platform.shared.contracts.module;

public record ModuleMetricView(
        String key,
        String label,
        long value
) {
}

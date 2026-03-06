package com.phaiffertech.platform.core.module.dto;

public record ModuleViewResponse(
        String code,
        String name,
        String description,
        boolean enabled
) {
}

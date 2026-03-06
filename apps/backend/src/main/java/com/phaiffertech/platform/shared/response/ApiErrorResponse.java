package com.phaiffertech.platform.shared.response;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(
        boolean success,
        String code,
        String message,
        Map<String, Object> details,
        Instant timestamp
) {
    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(false, code, message, null, Instant.now());
    }

    public static ApiErrorResponse of(String code, String message, Map<String, Object> details) {
        return new ApiErrorResponse(false, code, message, details, Instant.now());
    }
}

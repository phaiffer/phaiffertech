package com.phaiffertech.platform.shared.web;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIpResolver {

    private static final String FORWARDED = "Forwarded";
    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String X_REAL_IP = "X-Real-Ip";

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        String forwarded = resolveForwardedHeader(request.getHeader(FORWARDED));
        if (forwarded != null) {
            return forwarded;
        }

        String forwardedFor = request.getHeader(X_FORWARDED_FOR);
        if (forwardedFor != null) {
            String firstHop = forwardedFor.split(",")[0].trim();
            if (!firstHop.isBlank()) {
                return firstHop;
            }
        }

        String realIp = request.getHeader(X_REAL_IP);
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr() == null ? "unknown-ip" : request.getRemoteAddr();
    }

    private static String resolveForwardedHeader(String forwardedHeader) {
        if (forwardedHeader == null || forwardedHeader.isBlank()) {
            return null;
        }

        String firstForwardedValue = forwardedHeader.split(",")[0];
        String[] segments = firstForwardedValue.split(";");
        for (String segment : segments) {
            String candidate = segment.trim();
            if (!candidate.regionMatches(true, 0, "for=", 0, 4)) {
                continue;
            }

            String value = candidate.substring(4).trim();
            if (value.isEmpty()) {
                return null;
            }

            value = stripWrappingQuotes(value);
            if (value.startsWith("[") && value.endsWith("]")) {
                value = value.substring(1, value.length() - 1);
            }

            return value.isBlank() ? null : value;
        }

        return null;
    }

    private static String stripWrappingQuotes(String value) {
        if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }
}

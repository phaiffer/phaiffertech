package com.phaiffertech.platform.shared.web;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIpResolver {

    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String X_REAL_IP = "X-Real-Ip";

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
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
}

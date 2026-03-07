package com.phaiffertech.platform.core.auth.service;

import com.phaiffertech.platform.shared.exception.TooManyRequestsException;
import com.phaiffertech.platform.shared.security.BruteForceProtectionProperties;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {

    private final BruteForceProtectionProperties properties;
    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public LoginAttemptService(BruteForceProtectionProperties properties) {
        this.properties = properties;
    }

    public void checkAllowed(String tenantCode, String email, String ipAddress) {
        if (!properties.isEnabled()) {
            return;
        }
        AttemptState state = attempts.get(key(tenantCode, email, ipAddress));
        if (state == null) {
            return;
        }
        if (state.lockedUntil() != null && Instant.now().isBefore(state.lockedUntil())) {
            throw new TooManyRequestsException("Too many login attempts. Try again later.");
        }
    }

    public void onFailure(String tenantCode, String email, String ipAddress) {
        if (!properties.isEnabled()) {
            return;
        }
        String key = key(tenantCode, email, ipAddress);
        AttemptState current = attempts.getOrDefault(key, new AttemptState(0, null));
        int newCount = current.count() + 1;
        Instant lockedUntil = current.lockedUntil();

        if (newCount >= properties.getMaxAttempts()) {
            lockedUntil = Instant.now().plusSeconds(properties.getLockMinutes() * 60L);
            newCount = 0;
        }
        attempts.put(key, new AttemptState(newCount, lockedUntil));
    }

    public void onSuccess(String tenantCode, String email, String ipAddress) {
        attempts.remove(key(tenantCode, email, ipAddress));
    }

    private String key(String tenantCode, String email, String ipAddress) {
        return tenantCode + ":" + email.toLowerCase() + ":" + (ipAddress == null ? "unknown-ip" : ipAddress);
    }

    private record AttemptState(int count, Instant lockedUntil) {
    }
}

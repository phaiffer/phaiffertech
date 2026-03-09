package com.phaiffertech.platform.modules.iot.processing;

import java.time.Duration;
import java.time.Instant;
import java.util.regex.Pattern;

public final class IotPollingProfileSupport {

    private static final Duration DEFAULT_HEARTBEAT_WINDOW = Duration.ofMinutes(15);
    private static final Duration MIN_HEARTBEAT_WINDOW = Duration.ofSeconds(90);
    private static final Duration MAX_HEARTBEAT_WINDOW = Duration.ofMinutes(30);
    private static final long HEARTBEAT_MULTIPLIER = 6L;
    private static final Pattern SIMPLE_PROFILE_PATTERN = Pattern.compile("(?i)^(\\d+)\\s*([smh])$");

    private IotPollingProfileSupport() {
    }

    public static Duration resolveHeartbeatWindow(String pollingProfile) {
        Duration parsed = parsePollingProfile(pollingProfile);
        if (parsed == null) {
            return DEFAULT_HEARTBEAT_WINDOW;
        }

        Duration candidate = parsed.multipliedBy(HEARTBEAT_MULTIPLIER);
        if (candidate.compareTo(MIN_HEARTBEAT_WINDOW) < 0) {
            return MIN_HEARTBEAT_WINDOW;
        }
        if (candidate.compareTo(MAX_HEARTBEAT_WINDOW) > 0) {
            return MAX_HEARTBEAT_WINDOW;
        }
        return candidate;
    }

    public static boolean isFresh(Instant observedAt, String pollingProfile, Instant referenceTime) {
        if (observedAt == null) {
            return false;
        }
        Instant effectiveReference = referenceTime == null ? Instant.now() : referenceTime;
        return !observedAt.isBefore(effectiveReference.minus(resolveHeartbeatWindow(pollingProfile)));
    }

    private static Duration parsePollingProfile(String pollingProfile) {
        if (pollingProfile == null || pollingProfile.isBlank()) {
            return null;
        }

        var matcher = SIMPLE_PROFILE_PATTERN.matcher(pollingProfile.trim());
        if (!matcher.matches()) {
            return null;
        }

        long amount;
        try {
            amount = Long.parseLong(matcher.group(1));
        } catch (NumberFormatException ignored) {
            return null;
        }

        return switch (matcher.group(2).toLowerCase()) {
            case "s" -> Duration.ofSeconds(amount);
            case "m" -> Duration.ofMinutes(amount);
            case "h" -> Duration.ofHours(amount);
            default -> null;
        };
    }
}

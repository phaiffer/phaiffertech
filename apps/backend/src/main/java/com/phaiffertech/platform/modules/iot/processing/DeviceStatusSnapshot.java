package com.phaiffertech.platform.modules.iot.processing;

import java.time.Instant;

public record DeviceStatusSnapshot(
        String status,
        Instant lastSeenAt,
        boolean recentTelemetry,
        boolean hasCriticalOpenAlarm
) {
}

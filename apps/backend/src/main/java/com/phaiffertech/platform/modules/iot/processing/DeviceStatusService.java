package com.phaiffertech.platform.modules.iot.processing;

import java.time.Instant;
import java.util.UUID;

public interface DeviceStatusService {

    DeviceStatusSnapshot evaluate(UUID tenantId, UUID deviceId);

    DeviceStatusSnapshot refreshFromTelemetry(UUID tenantId, UUID deviceId, Instant observedAt);
}

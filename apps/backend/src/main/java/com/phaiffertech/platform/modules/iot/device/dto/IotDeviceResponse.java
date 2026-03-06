package com.phaiffertech.platform.modules.iot.device.dto;

import java.time.Instant;
import java.util.UUID;

public record IotDeviceResponse(
        UUID id,
        String name,
        String serialNumber,
        String status,
        Instant lastSeenAt
) {
}

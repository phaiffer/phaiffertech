package com.phaiffertech.platform.modules.iot.device.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public record IotDeviceResponse(
        UUID id,
        String name,
        String identifier,
        String type,
        String location,
        String status,
        Instant lastSeenAt,
        Instant createdAt,
        Instant updatedAt
) {

    @JsonProperty("serialNumber")
    public String legacySerialNumber() {
        return identifier;
    }
}

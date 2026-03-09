package com.phaiffertech.platform.modules.iot.device.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record IotDeviceUpdateRequest(
        @NotBlank String name,
        @NotBlank @JsonAlias("serialNumber") String identifier,
        String type,
        String location,
        String description,
        @NotBlank String status,
        @JsonAlias("protocol") @Pattern(regexp = "(?i)^(MODBUS_TCP|MODBUS_RTU)$") String transport,
        String host,
        @Min(1) @Max(65535) Integer port,
        @JsonAlias({"slaveId", "slave_id", "unit_id"}) @Min(0) @Max(255) Integer unitId,
        String pollingProfile,
        String gateway
) {
}

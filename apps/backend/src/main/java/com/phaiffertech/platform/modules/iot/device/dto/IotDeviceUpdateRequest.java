package com.phaiffertech.platform.modules.iot.device.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record IotDeviceUpdateRequest(
        @NotBlank String name,
        @NotBlank @JsonAlias("serialNumber") String identifier,
        String type,
        String location,
        @NotBlank String status
) {
}

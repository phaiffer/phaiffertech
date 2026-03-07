package com.phaiffertech.platform.modules.iot.device.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record IotDeviceCreateRequest(
        @NotBlank String name,
        @NotBlank @JsonAlias("serialNumber") String identifier,
        String type,
        String location,
        String status
) {
}

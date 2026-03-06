package com.phaiffertech.platform.modules.iot.device.dto;

import jakarta.validation.constraints.NotBlank;

public record IotDeviceCreateRequest(
        @NotBlank String name,
        @NotBlank String serialNumber,
        String status
) {
}

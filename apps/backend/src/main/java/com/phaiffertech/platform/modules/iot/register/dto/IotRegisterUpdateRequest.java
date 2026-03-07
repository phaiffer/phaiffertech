package com.phaiffertech.platform.modules.iot.register.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record IotRegisterUpdateRequest(
        @NotNull UUID deviceId,
        @NotBlank String name,
        @NotBlank String code,
        @NotBlank String metricName,
        String unit,
        @NotBlank String dataType,
        BigDecimal minThreshold,
        BigDecimal maxThreshold,
        @NotBlank String status
) {
}

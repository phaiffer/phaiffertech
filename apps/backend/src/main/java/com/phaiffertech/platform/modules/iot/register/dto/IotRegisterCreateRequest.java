package com.phaiffertech.platform.modules.iot.register.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.UUID;

public record IotRegisterCreateRequest(
        @NotNull UUID deviceId,
        @NotBlank String name,
        String code,
        @Pattern(regexp = "(?i)^FC\\d{2}$") String functionCode,
        @JsonAlias("offset") @Min(0) Integer registerAddress,
        @NotBlank String metricName,
        String unit,
        @NotBlank String dataType,
        BigDecimal minThreshold,
        BigDecimal maxThreshold,
        String status
) {
}

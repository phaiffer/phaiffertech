package com.phaiffertech.platform.core.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinanceCashMovementCreateRequest(
        UUID invoiceId,
        UUID paymentId,
        @NotBlank String direction,
        @NotBlank String category,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String currency,
        Instant occurredAt,
        @NotBlank String description
) {
}

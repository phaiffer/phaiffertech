package com.phaiffertech.platform.core.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinancePaymentCreateRequest(
        @NotNull UUID invoiceId,
        String status,
        String method,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        Instant receivedAt,
        String referenceCode,
        String notes
) {
}

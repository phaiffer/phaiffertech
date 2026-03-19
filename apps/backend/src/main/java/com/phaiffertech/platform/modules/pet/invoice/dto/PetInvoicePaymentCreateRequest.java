package com.phaiffertech.platform.modules.pet.invoice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public record PetInvoicePaymentCreateRequest(
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String method,
        Instant receivedAt,
        String referenceCode,
        String notes
) {
}

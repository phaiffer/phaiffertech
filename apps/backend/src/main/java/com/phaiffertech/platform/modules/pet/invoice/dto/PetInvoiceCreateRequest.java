package com.phaiffertech.platform.modules.pet.invoice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetInvoiceCreateRequest(
        @NotNull UUID clientId,
        @NotNull @DecimalMin("0.00") BigDecimal totalAmount,
        String status,
        Instant issuedAt
) {
}

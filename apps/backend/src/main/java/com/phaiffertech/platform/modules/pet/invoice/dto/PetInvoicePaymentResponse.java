package com.phaiffertech.platform.modules.pet.invoice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetInvoicePaymentResponse(
        UUID id,
        String status,
        String method,
        BigDecimal amount,
        Instant receivedAt,
        String referenceCode,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}

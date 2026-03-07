package com.phaiffertech.platform.modules.pet.invoice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PetInvoiceResponse(
        UUID id,
        UUID clientId,
        BigDecimal totalAmount,
        String status,
        Instant issuedAt,
        Instant createdAt,
        Instant updatedAt
) {
}

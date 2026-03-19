package com.phaiffertech.platform.modules.pet.invoice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PetInvoiceResponse(
        UUID id,
        UUID financeInvoiceId,
        UUID clientId,
        String clientName,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal outstandingAmount,
        String status,
        String description,
        String businessContextType,
        UUID businessContextId,
        String businessContextLabel,
        Instant issuedAt,
        Instant dueAt,
        Instant paidAt,
        Instant canceledAt,
        Instant createdAt,
        Instant updatedAt,
        List<PetInvoicePaymentResponse> payments
) {
}

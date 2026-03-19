package com.phaiffertech.platform.core.finance.dto;

import com.phaiffertech.platform.core.finance.domain.FinancePayment;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinancePaymentResponse(
        UUID id,
        UUID invoiceId,
        String status,
        String method,
        BigDecimal amount,
        Instant receivedAt,
        String referenceCode,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancePaymentResponse fromEntity(FinancePayment payment) {
        return new FinancePaymentResponse(
                payment.getId(),
                payment.getInvoiceId(),
                payment.getStatus().name(),
                payment.getMethod().name(),
                payment.getAmount(),
                payment.getReceivedAt(),
                payment.getReferenceCode(),
                payment.getNotes(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}

package com.phaiffertech.platform.core.finance.payment.dto;

import com.phaiffertech.platform.core.finance.payment.domain.FinancePaymentEvent;
import java.time.Instant;
import java.util.UUID;

public record FinancePaymentEventResponse(
        UUID id,
        UUID invoiceId,
        UUID financePaymentId,
        String provider,
        String eventType,
        String eventStatus,
        String idempotencyKey,
        Instant occurredAt,
        String summary,
        Instant createdAt
) {

    public static FinancePaymentEventResponse fromEntity(FinancePaymentEvent event) {
        return new FinancePaymentEventResponse(
                event.getId(),
                event.getInvoiceId(),
                event.getFinancePaymentId(),
                event.getProvider().name(),
                event.getEventType().name(),
                event.getEventStatus().name(),
                event.getIdempotencyKey(),
                event.getOccurredAt(),
                event.getSummary(),
                event.getCreatedAt()
        );
    }
}

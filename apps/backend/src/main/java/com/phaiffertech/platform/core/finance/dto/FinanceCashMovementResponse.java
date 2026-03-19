package com.phaiffertech.platform.core.finance.dto;

import com.phaiffertech.platform.core.finance.domain.FinanceCashMovement;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinanceCashMovementResponse(
        UUID id,
        UUID invoiceId,
        UUID paymentId,
        String direction,
        String category,
        BigDecimal amount,
        String currency,
        Instant occurredAt,
        String description,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinanceCashMovementResponse fromEntity(FinanceCashMovement movement) {
        return new FinanceCashMovementResponse(
                movement.getId(),
                movement.getInvoiceId(),
                movement.getPaymentId(),
                movement.getDirection().name(),
                movement.getCategory().name(),
                movement.getAmount(),
                movement.getCurrency(),
                movement.getOccurredAt(),
                movement.getDescription(),
                movement.getCreatedAt(),
                movement.getUpdatedAt()
        );
    }
}

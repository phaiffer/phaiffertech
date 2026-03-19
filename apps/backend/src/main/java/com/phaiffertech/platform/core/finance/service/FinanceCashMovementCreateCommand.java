package com.phaiffertech.platform.core.finance.service;

import com.phaiffertech.platform.core.finance.domain.FinanceCashCategory;
import com.phaiffertech.platform.core.finance.domain.FinanceCashDirection;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinanceCashMovementCreateCommand(
        UUID invoiceId,
        UUID paymentId,
        FinanceCashDirection direction,
        FinanceCashCategory category,
        BigDecimal amount,
        String currency,
        Instant occurredAt,
        String description
) {
}

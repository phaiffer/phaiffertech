package com.phaiffertech.platform.core.finance.service;

import com.phaiffertech.platform.core.finance.domain.FinancePaymentMethod;
import com.phaiffertech.platform.core.finance.domain.FinancePaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinancePaymentUpsertCommand(
        UUID invoiceId,
        FinancePaymentStatus status,
        FinancePaymentMethod method,
        BigDecimal amount,
        Instant receivedAt,
        String referenceCode,
        String notes
) {
}

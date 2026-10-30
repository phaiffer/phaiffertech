package com.phaiffertech.platform.core.finance.payment.service;

import com.phaiffertech.platform.core.finance.payment.domain.PaymentEventStatus;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentEventType;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;
import java.time.Instant;
import java.util.UUID;

public record FinancePaymentEventRecordCommand(
        UUID invoiceId,
        UUID financePaymentId,
        PaymentProviderType provider,
        PaymentEventType eventType,
        PaymentEventStatus eventStatus,
        String idempotencyKey,
        Instant occurredAt,
        String summary
) {
}

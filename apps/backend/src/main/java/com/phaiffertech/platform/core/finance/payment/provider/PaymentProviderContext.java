package com.phaiffertech.platform.core.finance.payment.provider;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentProviderContext(
        UUID tenantId,
        UUID invoiceId,
        UUID financePaymentId,
        String paymentMethod,
        BigDecimal amount,
        String currency,
        String referenceCode,
        String description
) {
}

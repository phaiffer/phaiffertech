package com.phaiffertech.platform.core.finance.payment.provider;

import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;

public record PaymentProviderChargeResult(
        PaymentProviderType provider,
        boolean implemented,
        String status,
        String providerChargeId,
        String summary
) {
}

package com.phaiffertech.platform.core.finance.payment.provider;

import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;
import org.springframework.stereotype.Component;

@Component
public class NoopPaymentProvider implements PaymentProvider {

    @Override
    public PaymentProviderType providerType() {
        return PaymentProviderType.NOOP;
    }

    @Override
    public boolean isImplemented() {
        return false;
    }

    @Override
    public PaymentProviderChargeResult registerManualSettlement(PaymentProviderContext context) {
        return new PaymentProviderChargeResult(
                providerType(),
                false,
                "NOOP",
                null,
                "No-op payment provider bypassed manual settlement."
        );
    }

    @Override
    public PaymentProviderChargeResult requestExternalCharge(PaymentProviderContext context) {
        return new PaymentProviderChargeResult(
                providerType(),
                false,
                "NOT_IMPLEMENTED",
                null,
                "External payment provider integration is not implemented yet."
        );
    }
}

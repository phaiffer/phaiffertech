package com.phaiffertech.platform.core.finance.payment.provider;

import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;
import org.springframework.stereotype.Component;

@Component
public class ManualPaymentProvider implements PaymentProvider {

    @Override
    public PaymentProviderType providerType() {
        return PaymentProviderType.MANUAL;
    }

    @Override
    public boolean isImplemented() {
        return true;
    }

    @Override
    public PaymentProviderChargeResult registerManualSettlement(PaymentProviderContext context) {
        String method = context.paymentMethod() == null || context.paymentMethod().isBlank()
                ? "MANUAL"
                : context.paymentMethod().trim().toUpperCase();
        return new PaymentProviderChargeResult(
                providerType(),
                true,
                "RECORDED",
                context.referenceCode(),
                "Manual settlement recorded via " + method + "."
        );
    }

    @Override
    public PaymentProviderChargeResult requestExternalCharge(PaymentProviderContext context) {
        return new PaymentProviderChargeResult(
                providerType(),
                true,
                "MANUAL_ONLY",
                context.referenceCode(),
                "Manual provider does not issue external PSP charges."
        );
    }
}

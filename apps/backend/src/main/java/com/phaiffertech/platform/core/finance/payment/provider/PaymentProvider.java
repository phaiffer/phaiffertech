package com.phaiffertech.platform.core.finance.payment.provider;

import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;

public interface PaymentProvider {

    PaymentProviderType providerType();

    boolean isImplemented();

    PaymentProviderChargeResult registerManualSettlement(PaymentProviderContext context);

    PaymentProviderChargeResult requestExternalCharge(PaymentProviderContext context);
}

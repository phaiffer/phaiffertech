package com.phaiffertech.platform.core.finance.payment.provider;

import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PaymentProviderRegistry {

    private final Map<PaymentProviderType, PaymentProvider> providersByType;
    private final ManualPaymentProvider manualProvider;
    private final NoopPaymentProvider noopProvider;

    public PaymentProviderRegistry(
            List<PaymentProvider> providers,
            ManualPaymentProvider manualProvider,
            NoopPaymentProvider noopProvider
    ) {
        Map<PaymentProviderType, PaymentProvider> map = new EnumMap<>(PaymentProviderType.class);
        for (PaymentProvider provider : providers) {
            map.putIfAbsent(provider.providerType(), provider);
        }
        this.providersByType = Map.copyOf(map);
        this.manualProvider = manualProvider;
        this.noopProvider = noopProvider;
    }

    public PaymentProvider resolve(PaymentProviderType providerType) {
        if (providerType == null) {
            return manualProvider;
        }
        return providersByType.getOrDefault(providerType, noopProvider);
    }

    public PaymentProvider resolve(String providerCode) {
        if (providerCode == null || providerCode.isBlank()) {
            return manualProvider;
        }
        try {
            PaymentProviderType type = PaymentProviderType.valueOf(providerCode.trim().toUpperCase(Locale.ROOT));
            return resolve(type);
        } catch (IllegalArgumentException ignored) {
            return noopProvider;
        }
    }
}

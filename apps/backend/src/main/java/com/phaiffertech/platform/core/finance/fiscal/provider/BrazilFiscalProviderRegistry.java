package com.phaiffertech.platform.core.finance.fiscal.provider;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class BrazilFiscalProviderRegistry {

    private final Map<String, BrazilFiscalProvider> providersByCode;
    private final NoopBrazilFiscalProvider noopProvider;

    public BrazilFiscalProviderRegistry(
            List<BrazilFiscalProvider> providers,
            NoopBrazilFiscalProvider noopProvider
    ) {
        this.providersByCode = providers.stream()
                .collect(Collectors.toMap(
                        provider -> normalize(provider.providerCode()),
                        Function.identity(),
                        (left, right) -> left
                ));
        this.noopProvider = noopProvider;
    }

    public BrazilFiscalProvider resolve(String providerCode) {
        if (providerCode == null || providerCode.isBlank()) {
            return noopProvider;
        }
        return providersByCode.getOrDefault(normalize(providerCode), noopProvider);
    }

    private String normalize(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }
}

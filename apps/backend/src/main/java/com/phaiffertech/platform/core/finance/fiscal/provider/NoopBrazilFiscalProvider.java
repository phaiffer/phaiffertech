package com.phaiffertech.platform.core.finance.fiscal.provider;

import org.springframework.stereotype.Component;

@Component
public class NoopBrazilFiscalProvider implements BrazilFiscalProvider {

    public static final String PROVIDER_CODE = "NOOP";

    @Override
    public String providerCode() {
        return PROVIDER_CODE;
    }

    @Override
    public boolean isImplemented() {
        return false;
    }

    @Override
    public BrazilFiscalSubmissionResult submitInvoice(BrazilFiscalProviderContext context) {
        return new BrazilFiscalSubmissionResult(
                providerCode(),
                false,
                "NOT_IMPLEMENTED",
                "Brazilian fiscal provider integration is not implemented yet.",
                null,
                null
        );
    }

    @Override
    public BrazilFiscalCancellationResult cancelInvoice(BrazilFiscalProviderContext context) {
        return new BrazilFiscalCancellationResult(
                providerCode(),
                false,
                "NOT_IMPLEMENTED",
                "Brazilian fiscal provider integration is not implemented yet.",
                null
        );
    }
}

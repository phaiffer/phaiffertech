package com.phaiffertech.platform.core.finance.fiscal.provider;

public interface BrazilFiscalProvider {

    String providerCode();

    boolean isImplemented();

    BrazilFiscalSubmissionResult submitInvoice(BrazilFiscalProviderContext context);

    BrazilFiscalCancellationResult cancelInvoice(BrazilFiscalProviderContext context);
}

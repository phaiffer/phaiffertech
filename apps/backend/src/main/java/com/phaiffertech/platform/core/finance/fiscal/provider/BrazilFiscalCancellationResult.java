package com.phaiffertech.platform.core.finance.fiscal.provider;

public record BrazilFiscalCancellationResult(
        String providerCode,
        boolean accepted,
        String status,
        String message,
        String externalReference
) {
}

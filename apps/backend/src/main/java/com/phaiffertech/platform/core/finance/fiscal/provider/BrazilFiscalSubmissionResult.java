package com.phaiffertech.platform.core.finance.fiscal.provider;

public record BrazilFiscalSubmissionResult(
        String providerCode,
        boolean accepted,
        String status,
        String message,
        String externalReference,
        String payloadReference
) {
}

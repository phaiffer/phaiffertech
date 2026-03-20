package com.phaiffertech.platform.core.finance.fiscal.dto;

import java.util.List;
import java.util.UUID;

public record FinanceFiscalReadinessResponse(
        UUID invoiceId,
        boolean tenantFiscalEnabled,
        boolean profileConfigured,
        boolean profileReady,
        boolean invoiceDataReady,
        boolean providerImplemented,
        boolean emissionReady,
        String providerCode,
        String fiscalStatus,
        String fiscalDocumentType,
        String documentSeries,
        String documentNumber,
        List<String> missingFields
) {
}

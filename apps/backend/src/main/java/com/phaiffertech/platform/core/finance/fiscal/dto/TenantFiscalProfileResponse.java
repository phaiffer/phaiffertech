package com.phaiffertech.platform.core.finance.fiscal.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TenantFiscalProfileResponse(
        UUID id,
        boolean enabled,
        boolean contractEnabled,
        boolean profileReady,
        String environment,
        String providerCode,
        String providerSettingsReference,
        String issuerLegalName,
        String issuerTradeName,
        String issuerDocumentType,
        String issuerDocumentNumber,
        String issuerStateRegistration,
        String issuerMunicipalRegistration,
        String issuerTaxRegimeCode,
        String issuerCityCode,
        String issuerCountryCode,
        Instant lastValidatedAt,
        Instant createdAt,
        Instant updatedAt,
        List<String> missingFields
) {
}

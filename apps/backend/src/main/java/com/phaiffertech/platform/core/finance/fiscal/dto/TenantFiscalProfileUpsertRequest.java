package com.phaiffertech.platform.core.finance.fiscal.dto;

public record TenantFiscalProfileUpsertRequest(
        boolean enabled,
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
        String issuerCountryCode
) {
}

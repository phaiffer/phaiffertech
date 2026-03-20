package com.phaiffertech.platform.core.finance.fiscal.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.finance.fiscal.domain.TenantFiscalEnvironment;
import com.phaiffertech.platform.core.finance.fiscal.domain.TenantFiscalProfile;
import com.phaiffertech.platform.core.finance.fiscal.dto.TenantFiscalProfileResponse;
import com.phaiffertech.platform.core.finance.fiscal.dto.TenantFiscalProfileUpsertRequest;
import com.phaiffertech.platform.core.finance.fiscal.repository.TenantFiscalProfileRepository;
import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantFiscalProfileService {

    private final TenantFiscalProfileRepository repository;
    private final TenantEntitlementService tenantEntitlementService;

    public TenantFiscalProfileService(
            TenantFiscalProfileRepository repository,
            TenantEntitlementService tenantEntitlementService
    ) {
        this.repository = repository;
        this.tenantEntitlementService = tenantEntitlementService;
    }

    @Transactional(readOnly = true)
    public TenantFiscalProfileResponse getCurrentTenantProfile() {
        UUID tenantId = currentTenantId();
        boolean contractEnabled = isFiscalContractEnabled(tenantId);
        return toResponse(findByTenantId(tenantId).orElse(null), contractEnabled);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "tenant_fiscal_profile")
    public TenantFiscalProfileResponse upsertCurrentTenantProfile(TenantFiscalProfileUpsertRequest request) {
        UUID tenantId = currentTenantId();
        TenantFiscalProfile profile = repository.findByTenantIdIncludingDeleted(tenantId)
                .orElseGet(TenantFiscalProfile::new);

        profile.setTenantId(tenantId);
        profile.setDeletedAt(null);
        profile.setEnabled(request.enabled());
        profile.setEnvironment(normalizeEnvironment(request.environment()));
        profile.setProviderCode(normalizeUppercaseCode(request.providerCode()));
        profile.setProviderSettingsReference(normalizeOptionalText(request.providerSettingsReference()));
        profile.setIssuerLegalName(normalizeOptionalText(request.issuerLegalName()));
        profile.setIssuerTradeName(normalizeOptionalText(request.issuerTradeName()));
        profile.setIssuerDocumentType(normalizeUppercaseCode(request.issuerDocumentType()));
        profile.setIssuerDocumentNumber(normalizeOptionalText(request.issuerDocumentNumber()));
        profile.setIssuerStateRegistration(normalizeOptionalText(request.issuerStateRegistration()));
        profile.setIssuerMunicipalRegistration(normalizeOptionalText(request.issuerMunicipalRegistration()));
        profile.setIssuerTaxRegimeCode(normalizeUppercaseCode(request.issuerTaxRegimeCode()));
        profile.setIssuerCityCode(normalizeOptionalText(request.issuerCityCode()));
        profile.setIssuerCountryCode(normalizeCountryCode(request.issuerCountryCode()));
        profile.setLastValidatedAt(null);

        TenantFiscalProfile saved = repository.save(profile);
        return toResponse(saved, isFiscalContractEnabled(tenantId));
    }

    @Transactional(readOnly = true)
    public Optional<TenantFiscalProfile> findByTenantId(UUID tenantId) {
        return repository.findByTenantIdAndDeletedAtIsNull(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<TenantFiscalProfile> findEnabledByTenantId(UUID tenantId) {
        return repository.findByTenantIdAndDeletedAtIsNullAndEnabledTrue(tenantId);
    }

    @Transactional(readOnly = true)
    public boolean isFiscalContractEnabled(UUID tenantId) {
        return tenantEntitlementService.hasEntitlement(tenantId, TenantEntitlementKeys.FINANCE_FISCAL);
    }

    public boolean isProfileReady(TenantFiscalProfile profile) {
        return profile != null && collectProfileMissingFields(profile).isEmpty();
    }

    public List<String> collectProfileMissingFields(TenantFiscalProfile profile) {
        if (profile == null) {
            return List.of("tenant_fiscal_profile");
        }

        List<String> missingFields = new ArrayList<>();
        if (isBlank(profile.getProviderCode())) {
            missingFields.add("provider_code");
        }
        if (isBlank(profile.getIssuerLegalName())) {
            missingFields.add("issuer_legal_name");
        }
        if (isBlank(profile.getIssuerDocumentType())) {
            missingFields.add("issuer_document_type");
        }
        if (isBlank(profile.getIssuerDocumentNumber())) {
            missingFields.add("issuer_document_number");
        }
        if (isBlank(profile.getIssuerTaxRegimeCode())) {
            missingFields.add("issuer_tax_regime_code");
        }
        return List.copyOf(missingFields);
    }

    private TenantFiscalProfileResponse toResponse(TenantFiscalProfile profile, boolean contractEnabled) {
        if (profile == null) {
            return new TenantFiscalProfileResponse(
                    null,
                    false,
                    contractEnabled,
                    false,
                    TenantFiscalEnvironment.SANDBOX.name(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "BR",
                    null,
                    null,
                    null,
                    List.of("tenant_fiscal_profile")
            );
        }

        List<String> missingFields = collectProfileMissingFields(profile);
        return new TenantFiscalProfileResponse(
                profile.getId(),
                profile.isEnabled(),
                contractEnabled,
                missingFields.isEmpty(),
                profile.getEnvironment().name(),
                profile.getProviderCode(),
                profile.getProviderSettingsReference(),
                profile.getIssuerLegalName(),
                profile.getIssuerTradeName(),
                profile.getIssuerDocumentType(),
                profile.getIssuerDocumentNumber(),
                profile.getIssuerStateRegistration(),
                profile.getIssuerMunicipalRegistration(),
                profile.getIssuerTaxRegimeCode(),
                profile.getIssuerCityCode(),
                profile.getIssuerCountryCode(),
                profile.getLastValidatedAt(),
                profile.getCreatedAt(),
                profile.getUpdatedAt(),
                missingFields
        );
    }

    private UUID currentTenantId() {
        return TenantContext.getRequiredTenantId();
    }

    private TenantFiscalEnvironment normalizeEnvironment(String value) {
        if (value == null || value.isBlank()) {
            return TenantFiscalEnvironment.SANDBOX;
        }
        return TenantFiscalEnvironment.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }

    private String normalizeCountryCode(String value) {
        String normalized = normalizeUppercaseCode(value);
        return normalized == null ? "BR" : normalized;
    }

    private String normalizeUppercaseCode(String value) {
        String normalized = normalizeOptionalText(value);
        return normalized == null ? null : normalized.toUpperCase(Locale.ROOT);
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

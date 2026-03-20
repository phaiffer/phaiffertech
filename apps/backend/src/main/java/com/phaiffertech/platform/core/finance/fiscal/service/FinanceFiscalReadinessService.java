package com.phaiffertech.platform.core.finance.fiscal.service;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoice;
import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.core.finance.fiscal.domain.TenantFiscalProfile;
import com.phaiffertech.platform.core.finance.fiscal.dto.FinanceFiscalReadinessResponse;
import com.phaiffertech.platform.core.finance.fiscal.provider.BrazilFiscalProvider;
import com.phaiffertech.platform.core.finance.fiscal.provider.BrazilFiscalProviderRegistry;
import com.phaiffertech.platform.core.finance.service.FinanceInvoiceService;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinanceFiscalReadinessService {

    private final FinanceInvoiceService financeInvoiceService;
    private final TenantFiscalProfileService tenantFiscalProfileService;
    private final BrazilFiscalProviderRegistry providerRegistry;

    public FinanceFiscalReadinessService(
            FinanceInvoiceService financeInvoiceService,
            TenantFiscalProfileService tenantFiscalProfileService,
            BrazilFiscalProviderRegistry providerRegistry
    ) {
        this.financeInvoiceService = financeInvoiceService;
        this.tenantFiscalProfileService = tenantFiscalProfileService;
        this.providerRegistry = providerRegistry;
    }

    @Transactional(readOnly = true)
    public FinanceFiscalReadinessResponse assessCurrentTenantInvoice(UUID invoiceId) {
        UUID tenantId = financeInvoiceService.currentTenantId();
        FinanceInvoice invoice = financeInvoiceService.getCurrentTenantOrThrow(invoiceId);
        TenantFiscalProfile profile = tenantFiscalProfileService.findByTenantId(tenantId).orElse(null);

        boolean contractEnabled = tenantFiscalProfileService.isFiscalContractEnabled(tenantId);
        boolean profileConfigured = profile != null;
        boolean profileReady = tenantFiscalProfileService.isProfileReady(profile);
        boolean tenantFiscalEnabled = contractEnabled && profile != null && profile.isEnabled();

        String requestedProviderCode = firstNonBlank(
                invoice.getFiscalProviderCode(),
                profile == null ? null : profile.getProviderCode()
        );
        BrazilFiscalProvider provider = providerRegistry.resolve(requestedProviderCode);

        List<String> missingFields = new ArrayList<>();
        if (!contractEnabled) {
            missingFields.add("tenant_fiscal_entitlement");
        }
        if (!profileConfigured) {
            missingFields.add("tenant_fiscal_profile");
        } else {
            if (!profile.isEnabled()) {
                missingFields.add("tenant_fiscal_profile.enabled");
            }
            tenantFiscalProfileService.collectProfileMissingFields(profile).forEach(field ->
                    missingFields.add("tenant_profile." + field));
        }

        List<String> invoiceMissingFields = collectInvoiceMissingFields(invoice);
        missingFields.addAll(invoiceMissingFields);

        boolean invoiceDataReady = invoiceMissingFields.isEmpty();
        boolean emissionReady = tenantFiscalEnabled && profileReady && invoiceDataReady && provider.isImplemented();

        return new FinanceFiscalReadinessResponse(
                invoice.getId(),
                tenantFiscalEnabled,
                profileConfigured,
                profileReady,
                invoiceDataReady,
                provider.isImplemented(),
                emissionReady,
                provider.providerCode(),
                invoice.getFiscalStatus(),
                invoice.getFiscalDocumentType(),
                invoice.getDocumentSeries(),
                invoice.getDocumentNumber(),
                List.copyOf(missingFields)
        );
    }

    private List<String> collectInvoiceMissingFields(FinanceInvoice invoice) {
        List<String> missingFields = new ArrayList<>();

        if (invoice.getStatus() == null || FinanceInvoiceStatus.DRAFT.equals(invoice.getStatus())) {
            missingFields.add("invoice.status.issued");
        }
        if (FinanceInvoiceStatus.CANCELED.equals(invoice.getStatus())) {
            missingFields.add("invoice.status.active");
        }
        if (isBlank(invoice.getFiscalDocumentType())) {
            missingFields.add("invoice.fiscalDocumentType");
        }
        if (isBlank(invoice.getDocumentSeries())) {
            missingFields.add("invoice.documentSeries");
        }
        if (isBlank(invoice.getIssuerLegalName())) {
            missingFields.add("invoice.issuer.legalName");
        }
        if (isBlank(invoice.getIssuerDocumentType())) {
            missingFields.add("invoice.issuer.documentType");
        }
        if (isBlank(invoice.getIssuerDocumentNumber())) {
            missingFields.add("invoice.issuer.documentNumber");
        }
        if (isBlank(invoice.getIssuerTaxRegimeCode())) {
            missingFields.add("invoice.issuer.taxRegimeCode");
        }
        if (isBlank(invoice.getRecipientLegalName())) {
            missingFields.add("invoice.recipient.legalName");
        }

        return List.copyOf(missingFields);
    }

    private String firstNonBlank(String left, String right) {
        if (!isBlank(left)) {
            return left.trim();
        }
        if (!isBlank(right)) {
            return right.trim();
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

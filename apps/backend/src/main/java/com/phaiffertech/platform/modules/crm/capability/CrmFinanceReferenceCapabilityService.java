package com.phaiffertech.platform.modules.crm.capability;

import com.phaiffertech.platform.modules.crm.deal.repository.CrmDealRepository;
import com.phaiffertech.platform.shared.contracts.finance.FinanceReferenceCapability;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CrmFinanceReferenceCapabilityService implements FinanceReferenceCapability {

    private static final Set<String> SUPPORTED_REFERENCE_TYPES = Set.of("CRM.DEAL");

    private final CrmDealRepository dealRepository;

    public CrmFinanceReferenceCapabilityService(CrmDealRepository dealRepository) {
        this.dealRepository = dealRepository;
    }

    @Override
    public boolean supports(String referenceType) {
        return SUPPORTED_REFERENCE_TYPES.contains(normalize(referenceType));
    }

    @Override
    public void validateReference(UUID tenantId, String referenceType, UUID relatedId) {
        if (describeReference(tenantId, referenceType, relatedId).isEmpty()) {
            throw new ResourceNotFoundException("CRM finance reference not found.");
        }
    }

    @Override
    public Optional<ReferenceDescriptor> describeReference(UUID tenantId, String referenceType, UUID relatedId) {
        if (!supports(referenceType) || relatedId == null) {
            return Optional.empty();
        }
        return dealRepository.findByIdAndTenantId(relatedId, tenantId)
                .map(deal -> new ReferenceDescriptor(
                        "CRM.DEAL",
                        "CRM",
                        "DEAL",
                        deal.getId(),
                        deal.getTitle(),
                        joinNonBlank(" · ", normalizeText(deal.getStatus()), amountLabel(deal.getAmount(), deal.getCurrency()))
                ));
    }

    private String amountLabel(java.math.BigDecimal amount, String currency) {
        if (amount == null) {
            return normalizeText(currency);
        }
        return joinNonBlank(" ", amount.toPlainString(), normalizeText(currency));
    }

    private String joinNonBlank(String separator, String... values) {
        StringBuilder builder = new StringBuilder();
        for (String value : values) {
            String normalized = normalizeText(value);
            if (normalized == null) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(separator);
            }
            builder.append(normalized);
        }
        return builder.isEmpty() ? null : builder.toString();
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim()
                .toUpperCase()
                .replace(':', '.')
                .replace('-', '_')
                .replace(' ', '_');
    }
}

package com.phaiffertech.platform.core.finance.service;

import com.phaiffertech.platform.shared.contracts.finance.FinanceReferenceCapability;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class FinanceReferenceResolverService {

    private final List<FinanceReferenceCapability> capabilities;

    public FinanceReferenceResolverService(List<FinanceReferenceCapability> capabilities) {
        this.capabilities = capabilities == null ? List.of() : capabilities;
    }

    public Optional<FinanceReferenceCapability.ReferenceDescriptor> describeReference(
            UUID tenantId,
            String referenceType,
            UUID relatedId
    ) {
        String normalizedType = normalize(referenceType);
        validateReferencePair(normalizedType, relatedId);
        if (normalizedType == null) {
            return Optional.empty();
        }

        FinanceReferenceCapability capability = findCapability(normalizedType)
                .orElseThrow(() -> new IllegalArgumentException("Unsupported finance reference type: " + referenceType));

        return capability.describeReference(tenantId, normalizedType, relatedId);
    }

    public FinanceReferenceCapability.ReferenceDescriptor requireReference(
            UUID tenantId,
            String referenceType,
            UUID relatedId,
            String notFoundMessage
    ) {
        return describeReference(tenantId, referenceType, relatedId)
                .orElseThrow(() -> new ResourceNotFoundException(notFoundMessage));
    }

    public String normalizeReferenceType(String referenceType) {
        return normalize(referenceType);
    }

    private Optional<FinanceReferenceCapability> findCapability(String referenceType) {
        return capabilities.stream()
                .filter(capability -> capability.supports(referenceType))
                .findFirst();
    }

    private void validateReferencePair(String referenceType, UUID relatedId) {
        if ((referenceType == null) != (relatedId == null)) {
            throw new IllegalArgumentException("Reference type and reference id must be provided together.");
        }
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

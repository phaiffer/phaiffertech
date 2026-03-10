package com.phaiffertech.platform.shared.contracts.crm;

import java.util.Optional;
import java.util.UUID;

public interface CrmRelatedReferenceCapability {

    boolean supports(String referenceType);

    void validateReference(UUID tenantId, String referenceType, UUID relatedId);

    Optional<ReferenceDescriptor> describeReference(UUID tenantId, String referenceType, UUID relatedId);

    record ReferenceDescriptor(
            String referenceType,
            String moduleCode,
            String entityType,
            UUID relatedId,
            String displayName,
            String displayContext
    ) {
    }
}

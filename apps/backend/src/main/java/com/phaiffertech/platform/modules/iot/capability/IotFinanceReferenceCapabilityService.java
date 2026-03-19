package com.phaiffertech.platform.modules.iot.capability;

import com.phaiffertech.platform.modules.iot.maintenance.repository.IotMaintenanceRepository;
import com.phaiffertech.platform.shared.contracts.finance.FinanceReferenceCapability;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class IotFinanceReferenceCapabilityService implements FinanceReferenceCapability {

    private static final Set<String> SUPPORTED_REFERENCE_TYPES = Set.of("IOT.MAINTENANCE");

    private final IotMaintenanceRepository maintenanceRepository;

    public IotFinanceReferenceCapabilityService(IotMaintenanceRepository maintenanceRepository) {
        this.maintenanceRepository = maintenanceRepository;
    }

    @Override
    public boolean supports(String referenceType) {
        return SUPPORTED_REFERENCE_TYPES.contains(normalize(referenceType));
    }

    @Override
    public void validateReference(UUID tenantId, String referenceType, UUID relatedId) {
        if (describeReference(tenantId, referenceType, relatedId).isEmpty()) {
            throw new ResourceNotFoundException("IoT finance reference not found.");
        }
    }

    @Override
    public Optional<ReferenceDescriptor> describeReference(UUID tenantId, String referenceType, UUID relatedId) {
        if (!supports(referenceType) || relatedId == null) {
            return Optional.empty();
        }
        return maintenanceRepository.findByIdAndTenantId(relatedId, tenantId)
                .map(maintenance -> new ReferenceDescriptor(
                        "IOT.MAINTENANCE",
                        "IOT",
                        "MAINTENANCE",
                        maintenance.getId(),
                        maintenance.getTitle(),
                        joinNonBlank(" · ", normalizeText(maintenance.getStatus()), normalizeText(maintenance.getPriority()))
                ));
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

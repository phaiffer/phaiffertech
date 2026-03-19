package com.phaiffertech.platform.modules.pet.capability;

import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.shared.contracts.finance.FinanceReferenceCapability;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PetFinanceReferenceCapabilityService implements FinanceReferenceCapability {

    private static final Set<String> SUPPORTED_REFERENCE_TYPES = Set.of(
            "PET.CLIENT",
            "PET.APPOINTMENT",
            "PET.SERVICE"
    );

    private final PetClientRepository clientRepository;
    private final PetAppointmentRepository appointmentRepository;
    private final PetProfileRepository profileRepository;
    private final PetServiceCatalogRepository serviceCatalogRepository;

    public PetFinanceReferenceCapabilityService(
            PetClientRepository clientRepository,
            PetAppointmentRepository appointmentRepository,
            PetProfileRepository profileRepository,
            PetServiceCatalogRepository serviceCatalogRepository
    ) {
        this.clientRepository = clientRepository;
        this.appointmentRepository = appointmentRepository;
        this.profileRepository = profileRepository;
        this.serviceCatalogRepository = serviceCatalogRepository;
    }

    @Override
    public boolean supports(String referenceType) {
        return SUPPORTED_REFERENCE_TYPES.contains(normalize(referenceType));
    }

    @Override
    public void validateReference(UUID tenantId, String referenceType, UUID relatedId) {
        if (describeReference(tenantId, referenceType, relatedId).isEmpty()) {
            throw new ResourceNotFoundException("Pet finance reference not found.");
        }
    }

    @Override
    public Optional<ReferenceDescriptor> describeReference(UUID tenantId, String referenceType, UUID relatedId) {
        String normalizedReference = normalize(referenceType);
        if (!supports(normalizedReference) || relatedId == null) {
            return Optional.empty();
        }

        return switch (normalizedReference) {
            case "PET.CLIENT" -> describeClient(tenantId, relatedId);
            case "PET.APPOINTMENT" -> describeAppointment(tenantId, relatedId);
            case "PET.SERVICE" -> describeService(tenantId, relatedId);
            default -> Optional.empty();
        };
    }

    private Optional<ReferenceDescriptor> describeClient(UUID tenantId, UUID relatedId) {
        return clientRepository.findByIdAndTenantId(relatedId, tenantId)
                .map(client -> new ReferenceDescriptor(
                        "PET.CLIENT",
                        "PET",
                        "CLIENT",
                        client.getId(),
                        clientName(client),
                        firstNonBlank(client.getEmail(), client.getPhone(), "Pet client")
                ));
    }

    private Optional<ReferenceDescriptor> describeAppointment(UUID tenantId, UUID relatedId) {
        return appointmentRepository.findByIdAndTenantId(relatedId, tenantId)
                .map(appointment -> new ReferenceDescriptor(
                        "PET.APPOINTMENT",
                        "PET",
                        "APPOINTMENT",
                        appointment.getId(),
                        firstNonBlank(appointment.getServiceName(), "Pet appointment"),
                        joinNonBlank(
                                " · ",
                                resolvePetName(tenantId, appointment.getPetId()),
                                appointment.getScheduledAt() == null ? null : appointment.getScheduledAt().toString()
                        )
                ));
    }

    private Optional<ReferenceDescriptor> describeService(UUID tenantId, UUID relatedId) {
        return serviceCatalogRepository.findByIdAndTenantId(relatedId, tenantId)
                .map(service -> new ReferenceDescriptor(
                        "PET.SERVICE",
                        "PET",
                        "SERVICE",
                        service.getId(),
                        service.getName(),
                        joinNonBlank(" · ", normalizeText(service.getDescription()), service.getPrice() == null ? null : service.getPrice().toPlainString())
                ));
    }

    private String resolvePetName(UUID tenantId, UUID petId) {
        if (petId == null) {
            return null;
        }
        return profileRepository.findByIdAndTenantId(petId, tenantId)
                .map(PetProfile::getName)
                .orElse(null);
    }

    private String clientName(PetClient client) {
        return firstNonBlank(client.getName(), client.getFullName(), "Pet client");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalizeText(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
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

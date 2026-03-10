package com.phaiffertech.platform.modules.pet.capability;

import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.shared.contracts.crm.CrmRelatedReferenceCapability;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PetCrmRelatedReferenceCapabilityService implements CrmRelatedReferenceCapability {

    private static final Set<String> SUPPORTED_REFERENCE_TYPES = Set.of(
            "PET.CLIENT",
            "PET.PROFILE",
            "PET.APPOINTMENT"
    );

    private final PetClientRepository clientRepository;
    private final PetProfileRepository profileRepository;
    private final PetAppointmentRepository appointmentRepository;

    public PetCrmRelatedReferenceCapabilityService(
            PetClientRepository clientRepository,
            PetProfileRepository profileRepository,
            PetAppointmentRepository appointmentRepository
    ) {
        this.clientRepository = clientRepository;
        this.profileRepository = profileRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public boolean supports(String referenceType) {
        return SUPPORTED_REFERENCE_TYPES.contains(normalize(referenceType));
    }

    @Override
    public void validateReference(UUID tenantId, String referenceType, UUID relatedId) {
        if (describeReference(tenantId, referenceType, relatedId).isEmpty()) {
            throw new ResourceNotFoundException("Pet reference not found.");
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
            case "PET.PROFILE" -> describeProfile(tenantId, relatedId);
            case "PET.APPOINTMENT" -> describeAppointment(tenantId, relatedId);
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
                        firstNonBlank(client.getFullName(), client.getName(), "Pet client"),
                        firstNonBlank(client.getEmail(), client.getPhone(), "Pet tutor")
                ));
    }

    private Optional<ReferenceDescriptor> describeProfile(UUID tenantId, UUID relatedId) {
        return profileRepository.findByIdAndTenantId(relatedId, tenantId)
                .map(profile -> new ReferenceDescriptor(
                        "PET.PROFILE",
                        "PET",
                        "PROFILE",
                        profile.getId(),
                        profile.getName(),
                        firstNonBlank(resolveClientName(tenantId, profile), humanize(profile.getSpecies()), "Pet profile")
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
                        firstNonBlank(
                                joinNonBlank(" · ",
                                        resolvePetName(tenantId, appointment.getPetId()),
                                        appointment.getScheduledAt() == null ? null : appointment.getScheduledAt().toString()
                                ),
                                "Scheduled pet appointment"
                        )
                ));
    }

    private String resolveClientName(UUID tenantId, PetProfile profile) {
        if (profile.getClientId() == null) {
            return null;
        }
        return clientRepository.findByIdAndTenantId(profile.getClientId(), tenantId)
                .map(this::clientName)
                .orElse(null);
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
        return firstNonBlank(client.getFullName(), client.getName(), "Pet client");
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

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String normalized = normalizeText(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String humanize(String token) {
        String normalized = normalize(token);
        if (normalized == null) {
            return null;
        }

        StringBuilder builder = new StringBuilder();
        for (String segment : normalized.split("_")) {
            if (segment.isEmpty()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(segment.charAt(0)).append(segment.substring(1).toLowerCase());
        }
        return builder.toString();
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

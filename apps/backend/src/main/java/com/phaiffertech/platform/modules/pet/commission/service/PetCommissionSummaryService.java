package com.phaiffertech.platform.modules.pet.commission.service;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLine;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentServiceLineRepository;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.commission.dto.PetCommissionSummaryDetailResponse;
import com.phaiffertech.platform.modules.pet.commission.dto.PetCommissionSummaryProfessionalResponse;
import com.phaiffertech.platform.modules.pet.commission.dto.PetCommissionSummaryResponse;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetCommissionSummaryService {

    private static final String COMPLETED_STATUS = "COMPLETED";

    private final PetAppointmentRepository appointmentRepository;
    private final PetAppointmentServiceLineRepository appointmentServiceLineRepository;
    private final PetServiceCatalogRepository petServiceCatalogRepository;
    private final PetProfessionalRepository petProfessionalRepository;
    private final PetClientRepository petClientRepository;
    private final PetProfileRepository petProfileRepository;

    public PetCommissionSummaryService(
            PetAppointmentRepository appointmentRepository,
            PetAppointmentServiceLineRepository appointmentServiceLineRepository,
            PetServiceCatalogRepository petServiceCatalogRepository,
            PetProfessionalRepository petProfessionalRepository,
            PetClientRepository petClientRepository,
            PetProfileRepository petProfileRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.appointmentServiceLineRepository = appointmentServiceLineRepository;
        this.petServiceCatalogRepository = petServiceCatalogRepository;
        this.petProfessionalRepository = petProfessionalRepository;
        this.petClientRepository = petClientRepository;
        this.petProfileRepository = petProfileRepository;
    }

    @Transactional(readOnly = true)
    public PetCommissionSummaryResponse summary(Instant scheduledFrom, Instant scheduledTo) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        List<PetAppointment> appointments = findAppointmentsForSummary(tenantId, scheduledFrom, scheduledTo);

        if (appointments.isEmpty()) {
            return new PetCommissionSummaryResponse(
                    scheduledFrom,
                    scheduledTo,
                    COMPLETED_STATUS,
                    BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    List.of(),
                    List.of()
            );
        }

        Map<UUID, List<PetAppointmentServiceLine>> serviceLinesByAppointmentId = appointmentServiceLineRepository
                .findAllByTenantIdAndAppointmentIdInOrderByAppointmentIdAscLineOrderAsc(
                        tenantId,
                        appointments.stream().map(PetAppointment::getId).toList()
                )
                .stream()
                .collect(Collectors.groupingBy(
                        PetAppointmentServiceLine::getAppointmentId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        Map<UUID, PetServiceCatalog> servicesById = loadServiceCatalogMap(tenantId, appointments, serviceLinesByAppointmentId);
        Map<UUID, String> professionalNames = loadProfessionalNames(tenantId, appointments, serviceLinesByAppointmentId);
        Map<UUID, String> clientNames = loadClientNames(tenantId, appointments);
        Map<UUID, String> petNames = loadPetNames(tenantId, appointments);

        List<PetCommissionSummaryDetailResponse> details = appointments.stream()
                .flatMap(appointment -> buildDetailRows(
                        appointment,
                        serviceLinesByAppointmentId.getOrDefault(appointment.getId(), List.of()),
                        servicesById,
                        professionalNames,
                        clientNames,
                        petNames
                ).stream())
                .toList();

        Map<UUID, ProfessionalAccumulator> professionalSummaries = new LinkedHashMap<>();
        Set<UUID> contributingAppointments = new LinkedHashSet<>();
        BigDecimal totalCommissionAmount = BigDecimal.ZERO;
        int generatedLineCount = 0;
        int excludedLineCount = 0;
        int eligibleWithoutAmountLineCount = 0;
        int unassignedLineCount = 0;
        int legacyLineCount = 0;

        for (PetCommissionSummaryDetailResponse detail : details) {
            LineStatus lineStatus = LineStatus.valueOf(detail.lineStatus());

            switch (lineStatus) {
                case GENERATED -> {
                    generatedLineCount++;
                    totalCommissionAmount = totalCommissionAmount.add(zeroSafe(detail.commissionAmount()));
                    contributingAppointments.add(detail.appointmentId());
                }
                case EXCLUDED -> excludedLineCount++;
                case ELIGIBLE_WITHOUT_AMOUNT -> eligibleWithoutAmountLineCount++;
                case UNASSIGNED -> unassignedLineCount++;
                case LEGACY_UNAVAILABLE -> legacyLineCount++;
            }

            if (detail.professionalId() == null || !lineStatus.participatesInProfessionalSummary()) {
                continue;
            }

            ProfessionalAccumulator accumulator = professionalSummaries.computeIfAbsent(
                    detail.professionalId(),
                    ignored -> new ProfessionalAccumulator(detail.professionalId(), detail.professionalName())
            );
            accumulator.accept(detail, lineStatus);
        }

        List<PetCommissionSummaryProfessionalResponse> professionals = professionalSummaries.values().stream()
                .map(ProfessionalAccumulator::toResponse)
                .sorted((left, right) -> {
                    int commissionComparison = right.totalCommissionAmount().compareTo(left.totalCommissionAmount());
                    if (commissionComparison != 0) {
                        return commissionComparison;
                    }

                    int generatedComparison = Integer.compare(right.generatedLineCount(), left.generatedLineCount());
                    if (generatedComparison != 0) {
                        return generatedComparison;
                    }

                    return left.professionalName().compareToIgnoreCase(right.professionalName());
                })
                .toList();

        return new PetCommissionSummaryResponse(
                scheduledFrom,
                scheduledTo,
                COMPLETED_STATUS,
                normalizeCurrency(totalCommissionAmount),
                professionals.size(),
                generatedLineCount,
                excludedLineCount,
                eligibleWithoutAmountLineCount,
                unassignedLineCount,
                legacyLineCount,
                contributingAppointments.size(),
                professionals,
                details
        );
    }

    private List<PetCommissionSummaryDetailResponse> buildDetailRows(
            PetAppointment appointment,
            List<PetAppointmentServiceLine> serviceLines,
            Map<UUID, PetServiceCatalog> servicesById,
            Map<UUID, String> professionalNames,
            Map<UUID, String> clientNames,
            Map<UUID, String> petNames
    ) {
        if (!serviceLines.isEmpty()) {
            return serviceLines.stream()
                    .map(line -> toDetailRow(
                            appointment,
                            line,
                            serviceLines.size(),
                            servicesById.get(line.getServiceId()),
                            professionalNames,
                            clientNames,
                            petNames
                    ))
                    .toList();
        }

        if (appointment.getServiceId() == null) {
            return List.of();
        }

        return List.of(toLegacyDetailRow(
                appointment,
                servicesById.get(appointment.getServiceId()),
                professionalNames,
                clientNames,
                petNames
        ));
    }

    private PetCommissionSummaryDetailResponse toDetailRow(
            PetAppointment appointment,
            PetAppointmentServiceLine line,
            int serviceLineCount,
            PetServiceCatalog serviceCatalog,
            Map<UUID, String> professionalNames,
            Map<UUID, String> clientNames,
            Map<UUID, String> petNames
    ) {
        boolean compatibilityFallbackUsed = false;

        UUID professionalId = line.getProfessionalId();
        if (professionalId == null && serviceLineCount == 1 && appointment.getProfessionalId() != null) {
            professionalId = appointment.getProfessionalId();
            compatibilityFallbackUsed = true;
        }

        String professionalName = firstNonBlank(
                line.getProfessionalName(),
                professionalId == null ? null : professionalNames.get(professionalId),
                professionalId == null ? null : professionalId.toString()
        );
        if (!Objects.equals(professionalName, line.getProfessionalName()) && professionalName != null) {
            compatibilityFallbackUsed = true;
        }

        Boolean commissionEligible = line.getCommissionEligible();
        if (commissionEligible == null && serviceCatalog != null) {
            commissionEligible = serviceCatalog.isCommissionEligible();
            compatibilityFallbackUsed = true;
        }

        BigDecimal commissionAmount = normalizeCurrency(line.getCommissionAmount());
        if (commissionAmount == null
                && serviceLineCount == 1
                && Boolean.TRUE.equals(commissionEligible)
                && appointment.getCommissionAmount() != null) {
            commissionAmount = normalizeCurrency(appointment.getCommissionAmount());
            compatibilityFallbackUsed = true;
        }

        LineStatus lineStatus = resolveLineStatus(professionalId, commissionEligible, commissionAmount);

        return new PetCommissionSummaryDetailResponse(
                appointment.getId(),
                line.getId(),
                appointment.getScheduledAt(),
                appointment.getStatus(),
                appointment.getClientId(),
                clientNames.getOrDefault(appointment.getClientId(), appointment.getClientId().toString()),
                appointment.getPetId(),
                petNames.getOrDefault(appointment.getPetId(), appointment.getPetId().toString()),
                line.getServiceId(),
                line.getServiceName(),
                line.getLineOrder(),
                professionalId,
                professionalName,
                normalizeCurrency(line.getServicePrice()),
                commissionEligible,
                line.getCommissionRate(),
                commissionAmount,
                lineStatus.name(),
                compatibilityFallbackUsed ? DetailSource.COMPATIBILITY_FALLBACK.name() : DetailSource.STRUCTURED_LINE.name()
        );
    }

    private List<PetAppointment> findAppointmentsForSummary(UUID tenantId, Instant scheduledFrom, Instant scheduledTo) {
        if (scheduledFrom != null && scheduledTo != null) {
            return appointmentRepository.findAllByTenantIdAndDeletedAtIsNullAndStatusAndScheduledAtBetweenOrderByScheduledAtDescIdDesc(
                    tenantId,
                    COMPLETED_STATUS,
                    scheduledFrom,
                    scheduledTo
            );
        }

        if (scheduledFrom != null) {
            return appointmentRepository.findAllByTenantIdAndDeletedAtIsNullAndStatusAndScheduledAtGreaterThanEqualOrderByScheduledAtDescIdDesc(
                    tenantId,
                    COMPLETED_STATUS,
                    scheduledFrom
            );
        }

        if (scheduledTo != null) {
            return appointmentRepository.findAllByTenantIdAndDeletedAtIsNullAndStatusAndScheduledAtLessThanEqualOrderByScheduledAtDescIdDesc(
                    tenantId,
                    COMPLETED_STATUS,
                    scheduledTo
            );
        }

        return appointmentRepository.findAllByTenantIdAndDeletedAtIsNullAndStatusOrderByScheduledAtDescIdDesc(
                tenantId,
                COMPLETED_STATUS
        );
    }

    private PetCommissionSummaryDetailResponse toLegacyDetailRow(
            PetAppointment appointment,
            PetServiceCatalog serviceCatalog,
            Map<UUID, String> professionalNames,
            Map<UUID, String> clientNames,
            Map<UUID, String> petNames
    ) {
        UUID professionalId = appointment.getProfessionalId();
        String professionalName = firstNonBlank(
                professionalId == null ? null : professionalNames.get(professionalId),
                professionalId == null ? null : professionalId.toString()
        );
        Boolean commissionEligible = serviceCatalog == null ? null : serviceCatalog.isCommissionEligible();
        BigDecimal commissionAmount = Boolean.TRUE.equals(commissionEligible)
                ? normalizeCurrency(appointment.getCommissionAmount())
                : null;
        LineStatus lineStatus = resolveLineStatus(professionalId, commissionEligible, commissionAmount);

        return new PetCommissionSummaryDetailResponse(
                appointment.getId(),
                null,
                appointment.getScheduledAt(),
                appointment.getStatus(),
                appointment.getClientId(),
                clientNames.getOrDefault(appointment.getClientId(), appointment.getClientId().toString()),
                appointment.getPetId(),
                petNames.getOrDefault(appointment.getPetId(), appointment.getPetId().toString()),
                appointment.getServiceId(),
                appointment.getServiceName(),
                0,
                professionalId,
                professionalName,
                normalizeCurrency(appointment.getServicePrice()),
                commissionEligible,
                null,
                commissionAmount,
                lineStatus.name(),
                DetailSource.COMPATIBILITY_FALLBACK.name()
        );
    }

    private LineStatus resolveLineStatus(UUID professionalId, Boolean commissionEligible, BigDecimal commissionAmount) {
        if (commissionEligible == null) {
            return LineStatus.LEGACY_UNAVAILABLE;
        }

        if (professionalId == null) {
            return LineStatus.UNASSIGNED;
        }

        if (!commissionEligible) {
            return LineStatus.EXCLUDED;
        }

        if (commissionAmount != null && commissionAmount.compareTo(BigDecimal.ZERO) > 0) {
            return LineStatus.GENERATED;
        }

        return LineStatus.ELIGIBLE_WITHOUT_AMOUNT;
    }

    private Map<UUID, PetServiceCatalog> loadServiceCatalogMap(
            UUID tenantId,
            List<PetAppointment> appointments,
            Map<UUID, List<PetAppointmentServiceLine>> serviceLinesByAppointmentId
    ) {
        Set<UUID> serviceIds = new LinkedHashSet<>();
        appointments.forEach(appointment -> {
            if (appointment.getServiceId() != null) {
                serviceIds.add(appointment.getServiceId());
            }

            serviceLinesByAppointmentId.getOrDefault(appointment.getId(), List.of())
                    .stream()
                    .map(PetAppointmentServiceLine::getServiceId)
                    .filter(Objects::nonNull)
                    .forEach(serviceIds::add);
        });

        if (serviceIds.isEmpty()) {
            return Map.of();
        }

        return petServiceCatalogRepository.findAllByTenantIdAndIdIn(tenantId, serviceIds).stream()
                .collect(Collectors.toMap(PetServiceCatalog::getId, Function.identity()));
    }

    private Map<UUID, String> loadProfessionalNames(
            UUID tenantId,
            List<PetAppointment> appointments,
            Map<UUID, List<PetAppointmentServiceLine>> serviceLinesByAppointmentId
    ) {
        Set<UUID> professionalIds = new LinkedHashSet<>();
        appointments.forEach(appointment -> {
            if (appointment.getProfessionalId() != null) {
                professionalIds.add(appointment.getProfessionalId());
            }

            serviceLinesByAppointmentId.getOrDefault(appointment.getId(), List.of())
                    .stream()
                    .map(PetAppointmentServiceLine::getProfessionalId)
                    .filter(Objects::nonNull)
                    .forEach(professionalIds::add);
        });

        if (professionalIds.isEmpty()) {
            return Map.of();
        }

        return petProfessionalRepository.findAllByTenantIdAndIdIn(tenantId, professionalIds).stream()
                .collect(Collectors.toMap(PetProfessional::getId, PetProfessional::getName));
    }

    private Map<UUID, String> loadClientNames(UUID tenantId, Collection<PetAppointment> appointments) {
        Set<UUID> clientIds = appointments.stream()
                .map(PetAppointment::getClientId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (clientIds.isEmpty()) {
            return Map.of();
        }

        return petClientRepository.findAllByTenantIdAndIdIn(tenantId, clientIds).stream()
                .collect(Collectors.toMap(PetClient::getId, PetClient::getName));
    }

    private Map<UUID, String> loadPetNames(UUID tenantId, Collection<PetAppointment> appointments) {
        Set<UUID> petIds = appointments.stream()
                .map(PetAppointment::getPetId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (petIds.isEmpty()) {
            return Map.of();
        }

        return petProfileRepository.findAllByTenantIdAndIdIn(tenantId, petIds).stream()
                .collect(Collectors.toMap(PetProfile::getId, PetProfile::getName));
    }

    private BigDecimal normalizeCurrency(BigDecimal amount) {
        if (amount == null) {
            return null;
        }

        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal zeroSafe(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        return null;
    }

    private enum LineStatus {
        GENERATED,
        EXCLUDED,
        ELIGIBLE_WITHOUT_AMOUNT,
        UNASSIGNED,
        LEGACY_UNAVAILABLE;

        private boolean participatesInProfessionalSummary() {
            return this == GENERATED || this == EXCLUDED || this == ELIGIBLE_WITHOUT_AMOUNT;
        }
    }

    private enum DetailSource {
        STRUCTURED_LINE,
        COMPATIBILITY_FALLBACK
    }

    private static final class ProfessionalAccumulator {

        private final UUID professionalId;
        private final String professionalName;
        private final Set<UUID> contributingAppointments = new LinkedHashSet<>();
        private BigDecimal totalCommissionAmount = BigDecimal.ZERO;
        private int generatedLineCount;
        private int excludedLineCount;
        private int eligibleWithoutAmountLineCount;

        private ProfessionalAccumulator(UUID professionalId, String professionalName) {
            this.professionalId = professionalId;
            this.professionalName = professionalName == null || professionalName.isBlank()
                    ? professionalId.toString()
                    : professionalName;
        }

        private void accept(PetCommissionSummaryDetailResponse detail, LineStatus lineStatus) {
            switch (lineStatus) {
                case GENERATED -> {
                    generatedLineCount++;
                    totalCommissionAmount = totalCommissionAmount.add(detail.commissionAmount());
                    contributingAppointments.add(detail.appointmentId());
                }
                case EXCLUDED -> excludedLineCount++;
                case ELIGIBLE_WITHOUT_AMOUNT -> eligibleWithoutAmountLineCount++;
                case UNASSIGNED, LEGACY_UNAVAILABLE -> {
                }
            }
        }

        private PetCommissionSummaryProfessionalResponse toResponse() {
            return new PetCommissionSummaryProfessionalResponse(
                    professionalId,
                    professionalName,
                    totalCommissionAmount.setScale(2, RoundingMode.HALF_UP),
                    generatedLineCount,
                    excludedLineCount,
                    eligibleWithoutAmountLineCount,
                    contributingAppointments.size()
            );
        }
    }
}

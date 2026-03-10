package com.phaiffertech.platform.modules.pet.medical.timeline.service;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.medical.prescription.domain.PetPrescription;
import com.phaiffertech.platform.modules.pet.medical.prescription.repository.PetPrescriptionRepository;
import com.phaiffertech.platform.modules.pet.medical.record.domain.PetMedicalRecord;
import com.phaiffertech.platform.modules.pet.medical.record.repository.PetMedicalRecordRepository;
import com.phaiffertech.platform.modules.pet.medical.timeline.dto.PetClinicalTimelineEventResponse;
import com.phaiffertech.platform.modules.pet.medical.timeline.dto.PetClinicalTimelineResponse;
import com.phaiffertech.platform.modules.pet.medical.vaccination.domain.PetVaccination;
import com.phaiffertech.platform.modules.pet.medical.vaccination.repository.PetVaccinationRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetClinicalTimelineService {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final PetAppointmentRepository petAppointmentRepository;
    private final PetMedicalRecordRepository petMedicalRecordRepository;
    private final PetVaccinationRepository petVaccinationRepository;
    private final PetPrescriptionRepository petPrescriptionRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetProfessionalRepository petProfessionalRepository;

    public PetClinicalTimelineService(
            PetAppointmentRepository petAppointmentRepository,
            PetMedicalRecordRepository petMedicalRecordRepository,
            PetVaccinationRepository petVaccinationRepository,
            PetPrescriptionRepository petPrescriptionRepository,
            PetProfileRepository petProfileRepository,
            PetProfessionalRepository petProfessionalRepository
    ) {
        this.petAppointmentRepository = petAppointmentRepository;
        this.petMedicalRecordRepository = petMedicalRecordRepository;
        this.petVaccinationRepository = petVaccinationRepository;
        this.petPrescriptionRepository = petPrescriptionRepository;
        this.petProfileRepository = petProfileRepository;
        this.petProfessionalRepository = petProfessionalRepository;
    }

    @Transactional(readOnly = true)
    public PetClinicalTimelineResponse getTimeline(UUID petId, UUID appointmentId, int limit) {
        if (petId == null && appointmentId == null) {
            throw new IllegalArgumentException("Clinical timeline requires petId or appointmentId.");
        }

        UUID tenantId = TenantContext.getRequiredTenantId();
        int normalizedLimit = normalizeLimit(limit);

        PetAppointment appointmentContext = null;
        UUID resolvedPetId = petId;

        if (appointmentId != null) {
            appointmentContext = petAppointmentRepository.findByIdAndTenantId(appointmentId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Pet appointment not found for timeline context."));
            if (resolvedPetId != null && !appointmentContext.getPetId().equals(resolvedPetId)) {
                throw new IllegalArgumentException("The informed appointment does not belong to the informed pet.");
            }
            resolvedPetId = appointmentContext.getPetId();
        }

        PetProfile petContext = resolvedPetId == null
                ? null
                : petProfileRepository.findByIdAndTenantId(resolvedPetId, tenantId).orElse(null);

        List<PetMedicalRecord> medicalRecords = appointmentId != null
                ? petMedicalRecordRepository.findAllByTenantIdAndAppointmentIdOrderByCreatedAtDesc(tenantId, appointmentId)
                : petMedicalRecordRepository.findAllByTenantIdAndPetIdOrderByCreatedAtDesc(tenantId, resolvedPetId);
        List<PetVaccination> vaccinations = appointmentId != null
                ? petVaccinationRepository.findAllByTenantIdAndAppointmentIdOrderByAppliedAtDesc(tenantId, appointmentId)
                : petVaccinationRepository.findAllByTenantIdAndPetIdOrderByAppliedAtDesc(tenantId, resolvedPetId);
        List<PetPrescription> prescriptions = appointmentId != null
                ? petPrescriptionRepository.findAllByTenantIdAndAppointmentIdOrderByCreatedAtDesc(tenantId, appointmentId)
                : petPrescriptionRepository.findAllByTenantIdAndPetIdOrderByCreatedAtDesc(tenantId, resolvedPetId);

        Map<UUID, String> petNames = loadPetNames(tenantId, collectPetIds(medicalRecords, vaccinations, prescriptions));
        Map<UUID, String> professionalNames = loadProfessionalNames(tenantId, collectProfessionalIds(medicalRecords, prescriptions));
        Map<UUID, PetAppointment> appointments = loadAppointments(tenantId, collectAppointmentIds(medicalRecords, vaccinations, prescriptions));

        List<PetClinicalTimelineEventResponse> events = new ArrayList<>();
        medicalRecords.forEach(record -> events.add(toEvent(record, petNames, professionalNames, appointments)));
        vaccinations.forEach(vaccination -> events.add(toEvent(vaccination, petNames, appointments)));
        prescriptions.forEach(prescription -> events.add(toEvent(prescription, petNames, professionalNames, appointments)));

        events.sort(Comparator.comparing(PetClinicalTimelineEventResponse::occurredAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        int totalEvents = events.size();
        List<PetClinicalTimelineEventResponse> limitedEvents = events.stream()
                .limit(normalizedLimit)
                .toList();

        return new PetClinicalTimelineResponse(
                petContext == null ? resolvedPetId : petContext.getId(),
                petContext == null ? petNames.get(resolvedPetId) : petContext.getName(),
                appointmentContext == null ? null : appointmentContext.getId(),
                appointmentContext == null ? null : appointmentContext.getServiceName(),
                appointmentContext == null ? null : appointmentContext.getScheduledAt(),
                appointmentContext == null ? null : appointmentContext.getStatus(),
                totalEvents,
                limitedEvents
        );
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private PetClinicalTimelineEventResponse toEvent(
            PetMedicalRecord record,
            Map<UUID, String> petNames,
            Map<UUID, String> professionalNames,
            Map<UUID, PetAppointment> appointments
    ) {
        PetAppointment appointment = appointments.get(record.getAppointmentId());
        return new PetClinicalTimelineEventResponse(
                "MEDICAL_RECORD",
                record.getId(),
                record.getCreatedAt(),
                record.getPetId(),
                petNames.get(record.getPetId()),
                record.getProfessionalId(),
                professionalNames.get(record.getProfessionalId()),
                record.getAppointmentId(),
                appointment == null ? null : appointment.getServiceName(),
                appointment == null ? null : appointment.getScheduledAt(),
                firstNonBlank(record.getDiagnosis(), "Prontuario clinico"),
                summarizeMedicalRecord(record)
        );
    }

    private PetClinicalTimelineEventResponse toEvent(
            PetVaccination vaccination,
            Map<UUID, String> petNames,
            Map<UUID, PetAppointment> appointments
    ) {
        PetAppointment appointment = appointments.get(vaccination.getAppointmentId());
        return new PetClinicalTimelineEventResponse(
                "VACCINATION",
                vaccination.getId(),
                vaccination.getAppliedAt(),
                vaccination.getPetId(),
                petNames.get(vaccination.getPetId()),
                null,
                null,
                vaccination.getAppointmentId(),
                appointment == null ? null : appointment.getServiceName(),
                appointment == null ? null : appointment.getScheduledAt(),
                vaccination.getVaccineName(),
                summarizeVaccination(vaccination)
        );
    }

    private PetClinicalTimelineEventResponse toEvent(
            PetPrescription prescription,
            Map<UUID, String> petNames,
            Map<UUID, String> professionalNames,
            Map<UUID, PetAppointment> appointments
    ) {
        PetAppointment appointment = appointments.get(prescription.getAppointmentId());
        return new PetClinicalTimelineEventResponse(
                "PRESCRIPTION",
                prescription.getId(),
                prescription.getCreatedAt(),
                prescription.getPetId(),
                petNames.get(prescription.getPetId()),
                prescription.getProfessionalId(),
                professionalNames.get(prescription.getProfessionalId()),
                prescription.getAppointmentId(),
                appointment == null ? null : appointment.getServiceName(),
                appointment == null ? null : appointment.getScheduledAt(),
                prescription.getMedication(),
                summarizePrescription(prescription)
        );
    }

    private String summarizeMedicalRecord(PetMedicalRecord record) {
        return joinParts(
                firstNonBlank(record.getDescription(), null),
                record.getTreatment() == null || record.getTreatment().isBlank()
                        ? null
                        : "Tratamento: " + record.getTreatment().trim()
        );
    }

    private String summarizeVaccination(PetVaccination vaccination) {
        return joinParts(
                vaccination.getNextDueAt() == null
                        ? null
                        : "Proximo reforco: " + DateTimeFormatter.ISO_LOCAL_DATE.withZone(ZoneOffset.UTC).format(vaccination.getNextDueAt()),
                firstNonBlank(vaccination.getNotes(), null)
        );
    }

    private String summarizePrescription(PetPrescription prescription) {
        return joinParts(
                firstNonBlank(prescription.getDosage(), null),
                firstNonBlank(prescription.getInstructions(), null)
        );
    }

    private String joinParts(String... parts) {
        return java.util.Arrays.stream(parts)
                .filter(Objects::nonNull)
                .filter(part -> !part.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(" | "));
    }

    private String firstNonBlank(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private Map<UUID, String> loadPetNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return petProfileRepository.findAllByTenantIdAndIdIn(tenantId, ids).stream()
                .collect(Collectors.toMap(PetProfile::getId, PetProfile::getName));
    }

    private Map<UUID, String> loadProfessionalNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return petProfessionalRepository.findAllByTenantIdAndIdIn(tenantId, ids).stream()
                .collect(Collectors.toMap(PetProfessional::getId, PetProfessional::getName));
    }

    private Map<UUID, PetAppointment> loadAppointments(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return petAppointmentRepository.findAllByTenantIdAndIdIn(tenantId, ids).stream()
                .collect(Collectors.toMap(PetAppointment::getId, Function.identity()));
    }

    private Collection<UUID> collectPetIds(
            List<PetMedicalRecord> medicalRecords,
            List<PetVaccination> vaccinations,
            List<PetPrescription> prescriptions
    ) {
        return java.util.stream.Stream.concat(
                        java.util.stream.Stream.concat(
                                medicalRecords.stream().map(PetMedicalRecord::getPetId),
                                vaccinations.stream().map(PetVaccination::getPetId)
                        ),
                        prescriptions.stream().map(PetPrescription::getPetId)
                )
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private Collection<UUID> collectProfessionalIds(List<PetMedicalRecord> medicalRecords, List<PetPrescription> prescriptions) {
        return java.util.stream.Stream.concat(
                        medicalRecords.stream().map(PetMedicalRecord::getProfessionalId),
                        prescriptions.stream().map(PetPrescription::getProfessionalId)
                )
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private Collection<UUID> collectAppointmentIds(
            List<PetMedicalRecord> medicalRecords,
            List<PetVaccination> vaccinations,
            List<PetPrescription> prescriptions
    ) {
        return java.util.stream.Stream.concat(
                        java.util.stream.Stream.concat(
                                medicalRecords.stream().map(PetMedicalRecord::getAppointmentId),
                                vaccinations.stream().map(PetVaccination::getAppointmentId)
                        ),
                        prescriptions.stream().map(PetPrescription::getAppointmentId)
                )
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }
}

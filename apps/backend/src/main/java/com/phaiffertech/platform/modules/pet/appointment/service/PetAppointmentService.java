package com.phaiffertech.platform.modules.pet.appointment.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentCreateRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentUpdateRequest;
import com.phaiffertech.platform.modules.pet.appointment.mapper.PetAppointmentMapper;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.medical.prescription.domain.PetPrescription;
import com.phaiffertech.platform.modules.pet.medical.prescription.repository.PetPrescriptionRepository;
import com.phaiffertech.platform.modules.pet.medical.record.domain.PetMedicalRecord;
import com.phaiffertech.platform.modules.pet.medical.record.repository.PetMedicalRecordRepository;
import com.phaiffertech.platform.modules.pet.medical.vaccination.domain.PetVaccination;
import com.phaiffertech.platform.modules.pet.medical.vaccination.repository.PetVaccinationRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import com.phaiffertech.platform.modules.pet.plan.repository.ClientPlanRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseSearchSpecificationBuilder;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetAppointmentService extends BaseTenantCrudService<
        PetAppointment,
        PetAppointmentCreateRequest,
        PetAppointmentUpdateRequest,
        PetAppointmentResponse> {

    private final PetAppointmentRepository repository;
    private final PetClientRepository petClientRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetServiceCatalogRepository petServiceCatalogRepository;
    private final PetProfessionalRepository petProfessionalRepository;
    private final PetMedicalRecordRepository petMedicalRecordRepository;
    private final PetVaccinationRepository petVaccinationRepository;
    private final PetPrescriptionRepository petPrescriptionRepository;
    private final PlatformMetricsService platformMetricsService;
    private final ClientPlanRepository clientPlanRepository;
    private final PetOperationalTriggerService operationalTriggerService;

    public PetAppointmentService(
            PetAppointmentRepository repository,
            PetClientRepository petClientRepository,
            PetProfileRepository petProfileRepository,
            PetServiceCatalogRepository petServiceCatalogRepository,
            PetProfessionalRepository petProfessionalRepository,
            PetMedicalRecordRepository petMedicalRecordRepository,
            PetVaccinationRepository petVaccinationRepository,
            PetPrescriptionRepository petPrescriptionRepository,
            PlatformMetricsService platformMetricsService,
            ClientPlanRepository clientPlanRepository,
            PetOperationalTriggerService operationalTriggerService
    ) {
        super(repository, repository, PetAppointmentMapper.INSTANCE, "Pet appointment not found.");
        this.repository = repository;
        this.petClientRepository = petClientRepository;
        this.petProfileRepository = petProfileRepository;
        this.petServiceCatalogRepository = petServiceCatalogRepository;
        this.petProfessionalRepository = petProfessionalRepository;
        this.petMedicalRecordRepository = petMedicalRecordRepository;
        this.petVaccinationRepository = petVaccinationRepository;
        this.petPrescriptionRepository = petPrescriptionRepository;
        this.platformMetricsService = platformMetricsService;
        this.clientPlanRepository = clientPlanRepository;
        this.operationalTriggerService = operationalTriggerService;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetAppointmentCreateRequest request, PetAppointment entity) {
        hydrateAndValidateRelations(tenantId, request.clientId(), request.petId(), request.serviceId(), request.professionalId(), request.servicePrice(), entity);
        // Validate plan if provided; do not consume session at creation time.
        if (request.clientPlanId() != null) {
            validatePlanForClient(tenantId, request.clientPlanId(), request.clientId());
        }
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetAppointmentUpdateRequest request, PetAppointment entity) {
        hydrateAndValidateRelations(tenantId, request.clientId(), request.petId(), request.serviceId(), request.professionalId(), request.servicePrice(), entity);
        // Validate plan if provided.
        if (request.clientPlanId() != null) {
            validatePlanForClient(tenantId, request.clientPlanId(), request.clientId());
        }
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_appointment")
    public PetAppointmentResponse create(PetAppointmentCreateRequest request) {
        PetAppointmentResponse response = doCreate(request);
        platformMetricsService.incrementPetAppointmentsCreated();
        return getById(response.id());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetAppointmentResponse> list(
            PageRequestDto pageRequest,
            String status,
            Instant scheduledFrom,
            Instant scheduledTo,
            UUID professionalId,
            UUID clientId,
            UUID petId,
            UUID serviceId
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "scheduledAt"));
        Page<PetAppointment> appointments = repository.findAllByTenantIdAndSearch(
                tenantId,
                BaseSearchSpecificationBuilder.normalizeUpper(status),
                professionalId,
                clientId,
                petId,
                serviceId,
                scheduledFrom,
                scheduledTo,
                query.search(),
                query.pageable()
        );
        Map<UUID, String> clientNames = loadClientNames(tenantId, appointments.getContent().stream()
                .map(PetAppointment::getClientId)
                .collect(Collectors.toSet()));
        Map<UUID, String> petNames = loadPetNames(tenantId, appointments.getContent().stream()
                .map(PetAppointment::getPetId)
                .collect(Collectors.toSet()));
        Map<UUID, String> professionalNames = loadProfessionalNames(tenantId, appointments.getContent().stream()
                .map(PetAppointment::getProfessionalId)
                .collect(Collectors.toSet()));
        Map<UUID, Integer> medicalRecordCounts = loadMedicalRecordCounts(tenantId, appointments.getContent());
        Map<UUID, Integer> vaccinationCounts = loadVaccinationCounts(tenantId, appointments.getContent());
        Map<UUID, Integer> prescriptionCounts = loadPrescriptionCounts(tenantId, appointments.getContent());
        Page<PetAppointmentResponse> mapped = appointments.map(appointment ->
                toValidatedResponse(
                        appointment,
                        clientNames,
                        petNames,
                        professionalNames,
                        medicalRecordCounts,
                        vaccinationCounts,
                        prescriptionCounts
                ));

        return PaginationUtils.fromPage(mapped);
    }

    @Transactional(readOnly = true)
    public PetAppointmentResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        return toValidatedResponse(getOrThrow(id, tenantId), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_appointment")
    public PetAppointmentResponse update(UUID id, PetAppointmentUpdateRequest request) {
        UUID tenantId = currentTenantId();
        PetAppointment entity = getOrThrow(id, tenantId);

        ensureLinkedClinicalEntriesAllowUpdate(tenantId, entity, request);

        PetAppointmentMapper.INSTANCE.updateEntity(entity, request);
        hydrateAndValidateRelations(tenantId, request.clientId(), request.petId(), request.serviceId(), request.professionalId(), request.servicePrice(), entity);

        // Consume a plan session when appointment transitions to COMPLETED for the first time.
        tryConsumePlanSession(tenantId, entity);

        PetAppointmentResponse response = toValidatedResponse(repository.save(entity), tenantId);

        // Fire "pet ready" operational signal after a successful COMPLETED transition.
        if ("COMPLETED".equals(entity.getStatus())) {
            PetClient client = petClientRepository.findByIdAndTenantId(entity.getClientId(), tenantId).orElse(null);
            String clientEmail = client != null ? client.getEmail() : null;
            String clientName = client != null ? resolveClientName(client) : null;
            operationalTriggerService.firePetReady(entity, clientEmail, clientName);
        }

        return response;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_appointment")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_appointment")
    public PetAppointmentResponse restore(UUID id) {
        UUID tenantId = currentTenantId();
        PetAppointment entity = getIncludingDeletedOrThrow(id, tenantId);

        beforeRestore(tenantId, entity);
        entity.setDeletedAt(null);

        return toValidatedResponse(repository.save(entity), tenantId);
    }

    @Override
    public void beforeRestore(UUID tenantId, PetAppointment entity) {
        validateContractIntegrity(entity);
    }

    @Override
    public void beforeDelete(UUID tenantId, PetAppointment entity) {
        if (hasLinkedClinicalEntries(tenantId, entity.getId())) {
            throw new ConflictOperationException(
                    "Pet appointment has linked clinical workflow entries and cannot be removed."
            );
        }
    }

    private void hydrateAndValidateRelations(
            UUID tenantId,
            UUID clientId,
            UUID petId,
            UUID serviceId,
            UUID professionalId,
            BigDecimal requestedServicePrice,
            PetAppointment entity
    ) {
        petClientRepository.findByIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet client not found for tenant."));

        PetProfile profile = petProfileRepository.findByIdAndTenantId(petId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found for tenant."));

        if (!profile.getClientId().equals(clientId)) {
            throw new ResourceNotFoundException("Pet profile does not belong to the informed client.");
        }

        PetServiceCatalog serviceCatalog = petServiceCatalogRepository.findByIdAndTenantId(serviceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet service not found for tenant."));

        PetProfessional professional = petProfessionalRepository.findByIdAndTenantId(professionalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet professional not found for tenant."));

        entity.setServiceId(serviceCatalog.getId());
        entity.setServiceName(serviceCatalog.getName());
        entity.setProfessionalId(professional.getId());

        // Price snapshot: use caller-supplied override if present; otherwise snapshot from catalog.
        if (requestedServicePrice != null) {
            entity.setServicePrice(requestedServicePrice);
        } else {
            entity.setServicePrice(serviceCatalog.getPrice());
        }

        // Snapshot commission amount from professional rate at booking time.
        BigDecimal finalPrice = entity.getServicePrice();
        entity.setCommissionAmount(
                professional.getCommissionRate() != null && finalPrice != null
                        ? finalPrice.multiply(professional.getCommissionRate()).setScale(2, RoundingMode.HALF_UP)
                        : null
        );
    }

    private PetAppointmentResponse toValidatedResponse(PetAppointment appointment, UUID tenantId) {
        validateContractIntegrity(appointment);
        Integer planRemaining = resolvePlanRemainingSessions(tenantId, appointment.getClientPlanId());
        return PetAppointmentMapper.INSTANCE.toResponse(
                appointment,
                resolveClientName(petClientRepository.findByIdAndTenantId(appointment.getClientId(), tenantId).orElse(null)),
                resolvePetName(petProfileRepository.findByIdAndTenantId(appointment.getPetId(), tenantId).orElse(null)),
                resolveProfessionalName(petProfessionalRepository.findByIdAndTenantId(appointment.getProfessionalId(), tenantId).orElse(null)),
                Math.toIntExact(petMedicalRecordRepository.countByTenantIdAndAppointmentId(tenantId, appointment.getId())),
                Math.toIntExact(petVaccinationRepository.countByTenantIdAndAppointmentId(tenantId, appointment.getId())),
                Math.toIntExact(petPrescriptionRepository.countByTenantIdAndAppointmentId(tenantId, appointment.getId())),
                planRemaining
        );
    }

    private Integer resolvePlanRemainingSessions(UUID tenantId, UUID clientPlanId) {
        if (clientPlanId == null) {
            return null;
        }
        return clientPlanRepository.findByIdAndTenantId(clientPlanId, tenantId)
                .map(ClientPlan::getRemainingSessions)
                .orElse(null);
    }

    private PetAppointmentResponse toValidatedResponse(
            PetAppointment appointment,
            Map<UUID, String> clientNames,
            Map<UUID, String> petNames,
            Map<UUID, String> professionalNames,
            Map<UUID, Integer> medicalRecordCounts,
            Map<UUID, Integer> vaccinationCounts,
            Map<UUID, Integer> prescriptionCounts
    ) {
        validateContractIntegrity(appointment);
        UUID tenantId = currentTenantId();
        Integer planRemaining = resolvePlanRemainingSessions(tenantId, appointment.getClientPlanId());
        return PetAppointmentMapper.INSTANCE.toResponse(
                appointment,
                clientNames.get(appointment.getClientId()),
                petNames.get(appointment.getPetId()),
                professionalNames.get(appointment.getProfessionalId()),
                medicalRecordCounts.getOrDefault(appointment.getId(), 0),
                vaccinationCounts.getOrDefault(appointment.getId(), 0),
                prescriptionCounts.getOrDefault(appointment.getId(), 0),
                planRemaining
        );
    }

    private void validateContractIntegrity(PetAppointment appointment) {
        if (appointment.getServiceId() == null || appointment.getProfessionalId() == null) {
            throw new ConflictOperationException(
                    "Pet appointment data is inconsistent with the current contract and requires remediation."
            );
        }
    }

    /**
     * Validates that the plan belongs to the tenant and to the specified client.
     * Does NOT consume a session — that happens only on COMPLETED transition.
     */
    private void validatePlanForClient(UUID tenantId, UUID planId, UUID clientId) {
        ClientPlan plan = clientPlanRepository.findByIdAndTenantId(planId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Client plan not found for tenant."));
        if (!plan.getClientId().equals(clientId)) {
            throw new ConflictOperationException("Client plan does not belong to the informed client.");
        }
        if (plan.getExpiresAt() != null && plan.getExpiresAt().toInstant().isBefore(java.time.Instant.now())) {
            throw new ConflictOperationException("Client plan has expired and cannot be used.");
        }
    }

    /**
     * Consumes one session from the linked plan when the appointment status is COMPLETED.
     * The planSessionConsumed flag prevents double-consumption on repeated identical updates.
     */
    private void tryConsumePlanSession(UUID tenantId, PetAppointment entity) {
        if (entity.getClientPlanId() == null) {
            return;
        }
        if (entity.isPlanSessionConsumed()) {
            // Session already consumed — idempotent guard.
            return;
        }
        if (!"COMPLETED".equals(entity.getStatus())) {
            return;
        }

        ClientPlan plan = clientPlanRepository.findByIdAndTenantId(entity.getClientPlanId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Client plan not found for tenant when consuming session."));

        if (plan.getRemainingSessions() <= 0) {
            throw new ConflictOperationException(
                    "Client plan has no remaining sessions. Cannot complete a plan-based appointment.");
        }

        plan.setUsedSessions(plan.getUsedSessions() + 1);
        clientPlanRepository.save(plan);

        entity.setPlanSessionConsumed(true);

        // Fire "plan near end" signal when exactly 2 sessions remain after consumption.
        if (plan.getRemainingSessions() == 2) {
            PetClient client = petClientRepository.findByIdAndTenantId(plan.getClientId(), tenantId).orElse(null);
            String clientEmail = client != null ? client.getEmail() : null;
            String clientName = client != null ? resolveClientName(client) : null;
            operationalTriggerService.firePlanNearEnd(plan, clientEmail, clientName, tenantId);
        }
    }

    private Map<UUID, String> loadClientNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(
                petClientRepository.findAllByTenantIdAndIdIn(tenantId, ids),
                PetClient::getId,
                this::resolveClientName
        );
    }

    private Map<UUID, String> loadPetNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(
                petProfileRepository.findAllByTenantIdAndIdIn(tenantId, ids),
                PetProfile::getId,
                PetProfile::getName
        );
    }

    private Map<UUID, String> loadProfessionalNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(
                petProfessionalRepository.findAllByTenantIdAndIdIn(tenantId, ids),
                PetProfessional::getId,
                PetProfessional::getName
        );
    }

    private Map<UUID, Integer> loadMedicalRecordCounts(UUID tenantId, Collection<PetAppointment> appointments) {
        if (appointments.isEmpty()) {
            return Map.of();
        }
        return countByAppointmentId(
                petMedicalRecordRepository.findAllByTenantIdAndAppointmentIdIn(
                        tenantId,
                        appointments.stream().map(PetAppointment::getId).collect(Collectors.toSet())
                ),
                PetMedicalRecord::getAppointmentId
        );
    }

    private Map<UUID, Integer> loadVaccinationCounts(UUID tenantId, Collection<PetAppointment> appointments) {
        if (appointments.isEmpty()) {
            return Map.of();
        }
        return countByAppointmentId(
                petVaccinationRepository.findAllByTenantIdAndAppointmentIdIn(
                        tenantId,
                        appointments.stream().map(PetAppointment::getId).collect(Collectors.toSet())
                ),
                PetVaccination::getAppointmentId
        );
    }

    private Map<UUID, Integer> loadPrescriptionCounts(UUID tenantId, Collection<PetAppointment> appointments) {
        if (appointments.isEmpty()) {
            return Map.of();
        }
        return countByAppointmentId(
                petPrescriptionRepository.findAllByTenantIdAndAppointmentIdIn(
                        tenantId,
                        appointments.stream().map(PetAppointment::getId).collect(Collectors.toSet())
                ),
                PetPrescription::getAppointmentId
        );
    }

    private <E> Map<UUID, Integer> countByAppointmentId(Collection<E> entities, Function<E, UUID> appointmentIdResolver) {
        return entities.stream().collect(Collectors.toMap(
                appointmentIdResolver,
                entity -> 1,
                Integer::sum
        ));
    }

    private boolean hasLinkedClinicalEntries(UUID tenantId, UUID appointmentId) {
        return petMedicalRecordRepository.existsByTenantIdAndAppointmentId(tenantId, appointmentId)
                || petVaccinationRepository.existsByTenantIdAndAppointmentId(tenantId, appointmentId)
                || petPrescriptionRepository.existsByTenantIdAndAppointmentId(tenantId, appointmentId);
    }

    private void ensureLinkedClinicalEntriesAllowUpdate(
            UUID tenantId,
            PetAppointment currentAppointment,
            PetAppointmentUpdateRequest request
    ) {
        if (!hasLinkedClinicalEntries(tenantId, currentAppointment.getId())) {
            return;
        }

        boolean relationshipsChanged = !currentAppointment.getClientId().equals(request.clientId())
                || !currentAppointment.getPetId().equals(request.petId())
                || !java.util.Objects.equals(currentAppointment.getServiceId(), request.serviceId())
                || !java.util.Objects.equals(currentAppointment.getProfessionalId(), request.professionalId());

        if (relationshipsChanged) {
            throw new ConflictOperationException(
                    "Pet appointment already has linked clinical workflow entries and cannot change client, pet, service or professional."
            );
        }
    }

    private <E> Map<UUID, String> toMap(
            Collection<E> entities,
            Function<E, UUID> idResolver,
            Function<E, String> valueResolver
    ) {
        return entities.stream().collect(Collectors.toMap(idResolver, valueResolver));
    }

    private String resolveClientName(PetClient client) {
        if (client == null) {
            return null;
        }
        if (client.getName() != null && !client.getName().isBlank()) {
            return client.getName();
        }
        return client.getFullName();
    }

    private String resolvePetName(PetProfile profile) {
        return profile == null ? null : profile.getName();
    }

    private String resolveProfessionalName(PetProfessional professional) {
        return professional == null ? null : professional.getName();
    }
}

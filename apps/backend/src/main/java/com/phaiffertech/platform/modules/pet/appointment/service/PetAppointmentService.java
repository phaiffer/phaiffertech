package com.phaiffertech.platform.modules.pet.appointment.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLine;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentCreateRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentServiceLineResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentUpdateRequest;
import com.phaiffertech.platform.modules.pet.appointment.mapper.PetAppointmentMapper;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentServiceLineRepository;
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
import com.phaiffertech.platform.modules.pet.servicecatalog.service.PetServiceCatalogCategoryPolicyService;
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
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
    private final PetAppointmentServiceLineRepository appointmentServiceLineRepository;
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
    private final PetServiceCatalogCategoryPolicyService serviceCatalogCategoryPolicyService;

    public PetAppointmentService(
            PetAppointmentRepository repository,
            PetAppointmentServiceLineRepository appointmentServiceLineRepository,
            PetClientRepository petClientRepository,
            PetProfileRepository petProfileRepository,
            PetServiceCatalogRepository petServiceCatalogRepository,
            PetProfessionalRepository petProfessionalRepository,
            PetMedicalRecordRepository petMedicalRecordRepository,
            PetVaccinationRepository petVaccinationRepository,
            PetPrescriptionRepository petPrescriptionRepository,
            PlatformMetricsService platformMetricsService,
            ClientPlanRepository clientPlanRepository,
            PetOperationalTriggerService operationalTriggerService,
            PetServiceCatalogCategoryPolicyService serviceCatalogCategoryPolicyService
    ) {
        super(repository, repository, PetAppointmentMapper.INSTANCE, "Pet appointment not found.");
        this.repository = repository;
        this.appointmentServiceLineRepository = appointmentServiceLineRepository;
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
        this.serviceCatalogCategoryPolicyService = serviceCatalogCategoryPolicyService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_appointment")
    public PetAppointmentResponse create(PetAppointmentCreateRequest request) {
        UUID tenantId = currentTenantId();
        PetAppointment entity = PetAppointmentMapper.INSTANCE.toNewEntity(request);
        entity.setTenantId(tenantId);

        AppointmentServiceSelection selection = hydrateAndValidateRelations(
                tenantId,
                request.clientId(),
                request.petId(),
                request.serviceId(),
                request.serviceIds(),
                request.professionalId(),
                request.servicePrice(),
                request.clientPlanId(),
                List.of(),
                null,
                entity
        );
        if (request.clientPlanId() != null) {
            validatePlanForClient(tenantId, request.clientPlanId(), request.clientId());
        }

        PetAppointment saved = repository.save(entity);
        replaceAppointmentServiceLines(tenantId, saved, selection.services());
        platformMetricsService.incrementPetAppointmentsCreated();
        return toValidatedResponse(saved, tenantId);
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
        Map<UUID, List<PetAppointmentServiceLineResponse>> appointmentServices = loadAppointmentServices(
                tenantId,
                appointments.getContent()
        );
        Page<PetAppointmentResponse> mapped = appointments.map(appointment ->
                toValidatedResponse(
                        appointment,
                        clientNames,
                        petNames,
                        professionalNames,
                        appointmentServices,
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

        UUID previousClientPlanId = entity.getClientPlanId();
        List<UUID> previousServiceIds = resolveCurrentServiceIds(tenantId, entity);
        PetAppointmentMapper.INSTANCE.updateEntity(entity, request);
        AppointmentServiceSelection selection = hydrateAndValidateRelations(
                tenantId,
                request.clientId(),
                request.petId(),
                request.serviceId(),
                request.serviceIds(),
                request.professionalId(),
                request.servicePrice(),
                request.clientPlanId(),
                previousServiceIds,
                previousClientPlanId,
                entity
        );

        // Consume a plan session when appointment transitions to COMPLETED for the first time.
        tryConsumePlanSession(tenantId, entity);

        PetAppointment saved = repository.save(entity);
        replaceAppointmentServiceLines(tenantId, saved, selection.services());
        PetAppointmentResponse response = toValidatedResponse(saved, tenantId);

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

    private AppointmentServiceSelection hydrateAndValidateRelations(
            UUID tenantId,
            UUID clientId,
            UUID petId,
            UUID serviceId,
            List<UUID> requestedServiceIds,
            UUID professionalId,
            BigDecimal requestedServicePrice,
            UUID requestedClientPlanId,
            List<UUID> previousServiceIds,
            UUID previousClientPlanId,
            PetAppointment entity
    ) {
        petClientRepository.findByIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet client not found for tenant."));

        PetProfile profile = petProfileRepository.findByIdAndTenantId(petId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found for tenant."));

        if (!profile.getClientId().equals(clientId)) {
            throw new ResourceNotFoundException("Pet profile does not belong to the informed client.");
        }

        List<UUID> resolvedServiceIds = resolveRequestedServiceIds(serviceId, requestedServiceIds);
        List<PetServiceCatalog> selectedServices = loadSelectedServices(tenantId, resolvedServiceIds);
        Set<UUID> previousServiceIdSet = new LinkedHashSet<>(previousServiceIds);

        for (PetServiceCatalog selectedService : selectedServices) {
            validateServiceCatalogBookingAccess(
                    tenantId,
                    selectedService,
                    requestedClientPlanId,
                    previousServiceIdSet.contains(selectedService.getId()),
                    previousClientPlanId
            );
        }

        PetProfessional professional = petProfessionalRepository.findByIdAndTenantId(professionalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet professional not found for tenant."));

        PetServiceCatalog primaryService = selectedServices.getFirst();
        entity.setServiceId(primaryService.getId());
        entity.setServiceName(resolveAppointmentServiceHeadline(selectedServices));
        entity.setProfessionalId(professional.getId());

        BigDecimal totalCatalogServicePrice = selectedServices.stream()
                .map(PetServiceCatalog::getPrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal resolvedServicePrice = requestedServicePrice != null
                ? normalizeCurrency(requestedServicePrice)
                : totalCatalogServicePrice;

        if (requestedServicePrice != null) {
            entity.setServicePrice(resolvedServicePrice);
        } else {
            entity.setServicePrice(totalCatalogServicePrice);
        }

        List<AppointmentServiceLineSelection> serviceLines = buildAppointmentServiceLineSelections(
                selectedServices,
                professional,
                resolvedServicePrice,
                requestedServicePrice != null
        );
        entity.setCommissionAmount(resolveAppointmentCommissionAmount(serviceLines));

        return new AppointmentServiceSelection(serviceLines);
    }

    private void validateServiceCatalogBookingAccess(
            UUID tenantId,
            PetServiceCatalog serviceCatalog,
            UUID requestedClientPlanId,
            boolean keepingCurrentService,
            UUID previousClientPlanId
    ) {
        boolean planUsageChanged = !Objects.equals(previousClientPlanId, requestedClientPlanId);

        if (!serviceCatalog.isActive() && !keepingCurrentService) {
            throw new ConflictOperationException("Pet service is inactive and cannot be booked for new appointments.");
        }

        if (!serviceCatalogCategoryPolicyService.canUseCategory(tenantId, serviceCatalog.getCategory()) && !keepingCurrentService) {
            throw new ConflictOperationException(
                    "Pet service category is not available for the current tenant package."
            );
        }

        if (requestedClientPlanId != null && !serviceCatalog.isAllowInPlans() && (!keepingCurrentService || planUsageChanged)) {
            throw new ConflictOperationException("Pet service is not available for plan-based appointments.");
        }

        if (requestedClientPlanId == null && !serviceCatalog.isAllowStandaloneBooking() && (!keepingCurrentService || previousClientPlanId != null)) {
            throw new ConflictOperationException("Pet service requires a linked plan before booking.");
        }
    }

    private PetAppointmentResponse toValidatedResponse(PetAppointment appointment, UUID tenantId) {
        validateContractIntegrity(appointment);
        Integer planRemaining = resolvePlanRemainingSessions(tenantId, appointment.getClientPlanId());
        List<UUID> currentServiceIds = resolveCurrentServiceIds(tenantId, appointment);
        List<PetAppointmentServiceLineResponse> appointmentServices = resolveAppointmentServiceResponses(
                appointment,
                appointmentServiceLineRepository.findAllByTenantIdAndAppointmentIdOrderByLineOrderAsc(
                        tenantId,
                        appointment.getId()
                ),
                loadServiceCatalogMap(tenantId, currentServiceIds)
        );
        return PetAppointmentMapper.INSTANCE.toResponse(
                appointment,
                resolveClientName(petClientRepository.findByIdAndTenantId(appointment.getClientId(), tenantId).orElse(null)),
                resolvePetName(petProfileRepository.findByIdAndTenantId(appointment.getPetId(), tenantId).orElse(null)),
                resolveProfessionalName(petProfessionalRepository.findByIdAndTenantId(appointment.getProfessionalId(), tenantId).orElse(null)),
                appointmentServices,
                appointmentServices.size(),
                resolveTotalServiceDurationMinutes(appointmentServices),
                resolveTotalServiceBasePrice(appointmentServices, appointment.getServicePrice()),
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
            Map<UUID, List<PetAppointmentServiceLineResponse>> appointmentServices,
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
                appointmentServices.getOrDefault(appointment.getId(), List.of()),
                appointmentServices.getOrDefault(appointment.getId(), List.of()).size(),
                resolveTotalServiceDurationMinutes(appointmentServices.getOrDefault(appointment.getId(), List.of())),
                resolveTotalServiceBasePrice(
                        appointmentServices.getOrDefault(appointment.getId(), List.of()),
                        appointment.getServicePrice()
                ),
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
                || !new LinkedHashSet<>(resolveCurrentServiceIds(tenantId, currentAppointment)).equals(
                        new LinkedHashSet<>(resolveRequestedServiceIds(request.serviceId(), request.serviceIds()))
                )
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

    private List<UUID> resolveRequestedServiceIds(UUID serviceId, List<UUID> requestedServiceIds) {
        List<UUID> candidates = requestedServiceIds == null || requestedServiceIds.isEmpty()
                ? List.of(serviceId)
                : requestedServiceIds.stream().filter(Objects::nonNull).toList();

        if (candidates.isEmpty()) {
            throw new ConflictOperationException("Pet appointment requires at least one structured service.");
        }

        LinkedHashSet<UUID> uniqueServiceIds = new LinkedHashSet<>(candidates);
        if (uniqueServiceIds.size() != candidates.size()) {
            throw new ConflictOperationException("Pet appointment cannot repeat the same service in a single booking.");
        }

        return List.copyOf(uniqueServiceIds);
    }

    private List<PetServiceCatalog> loadSelectedServices(UUID tenantId, List<UUID> selectedServiceIds) {
        Map<UUID, PetServiceCatalog> servicesById = petServiceCatalogRepository.findAllByTenantIdAndIdIn(tenantId, selectedServiceIds)
                .stream()
                .collect(Collectors.toMap(PetServiceCatalog::getId, Function.identity()));

        if (servicesById.size() != selectedServiceIds.size()) {
            throw new ResourceNotFoundException("Pet service not found for tenant.");
        }

        return selectedServiceIds.stream().map(servicesById::get).toList();
    }

    private String resolveAppointmentServiceHeadline(List<PetServiceCatalog> services) {
        PetServiceCatalog primaryService = services.getFirst();
        if (services.size() == 1) {
            return primaryService.getName();
        }
        return primaryService.getName() + " + " + (services.size() - 1) + " more";
    }

    private void replaceAppointmentServiceLines(
            UUID tenantId,
            PetAppointment appointment,
            List<AppointmentServiceLineSelection> selectedServices
    ) {
        appointmentServiceLineRepository.deleteAllByTenantIdAndAppointmentId(tenantId, appointment.getId());
        appointmentServiceLineRepository.flush();

        List<PetAppointmentServiceLine> lines = selectedServices.stream()
                .map(selection -> buildAppointmentServiceLine(tenantId, appointment, selection))
                .toList();
        appointmentServiceLineRepository.saveAll(lines);
    }

    private PetAppointmentServiceLine buildAppointmentServiceLine(
            UUID tenantId,
            PetAppointment appointment,
            AppointmentServiceLineSelection selection
    ) {
        PetServiceCatalog serviceCatalog = selection.serviceCatalog();
        PetAppointmentServiceLine line = new PetAppointmentServiceLine();
        line.setTenantId(tenantId);
        line.setAppointmentId(appointment.getId());
        line.setServiceId(serviceCatalog.getId());
        line.setLineOrder(selection.lineOrder());
        line.setServiceName(serviceCatalog.getName());
        line.setServiceCategory(serviceCatalog.getCategory());
        line.setDurationMinutes(serviceCatalog.getDurationMinutes());
        line.setServicePrice(selection.servicePrice());
        line.setCommissionEligible(selection.commissionEligible());
        line.setCommissionRate(selection.commissionRate());
        line.setCommissionAmount(selection.commissionAmount());
        return line;
    }

    private List<UUID> resolveCurrentServiceIds(UUID tenantId, PetAppointment appointment) {
        List<PetAppointmentServiceLine> lines = appointmentServiceLineRepository.findAllByTenantIdAndAppointmentIdOrderByLineOrderAsc(
                tenantId,
                appointment.getId()
        );
        if (!lines.isEmpty()) {
            return lines.stream().map(PetAppointmentServiceLine::getServiceId).toList();
        }
        return appointment.getServiceId() == null ? List.of() : List.of(appointment.getServiceId());
    }

    private Map<UUID, List<PetAppointmentServiceLineResponse>> loadAppointmentServices(
            UUID tenantId,
            Collection<PetAppointment> appointments
    ) {
        if (appointments.isEmpty()) {
            return Map.of();
        }

        List<UUID> appointmentIds = appointments.stream().map(PetAppointment::getId).toList();
        Map<UUID, List<PetAppointmentServiceLine>> linesByAppointmentId = appointmentServiceLineRepository
                .findAllByTenantIdAndAppointmentIdInOrderByAppointmentIdAscLineOrderAsc(tenantId, appointmentIds)
                .stream()
                .collect(Collectors.groupingBy(PetAppointmentServiceLine::getAppointmentId));

        Set<UUID> serviceIds = new LinkedHashSet<>();
        appointments.forEach(appointment -> {
            List<PetAppointmentServiceLine> lines = linesByAppointmentId.get(appointment.getId());
            if (lines == null || lines.isEmpty()) {
                if (appointment.getServiceId() != null) {
                    serviceIds.add(appointment.getServiceId());
                }
                return;
            }
            lines.forEach(line -> serviceIds.add(line.getServiceId()));
        });

        Map<UUID, PetServiceCatalog> servicesById = loadServiceCatalogMap(tenantId, serviceIds);

        return appointments.stream().collect(Collectors.toMap(
                PetAppointment::getId,
                appointment -> resolveAppointmentServiceResponses(
                        appointment,
                        linesByAppointmentId.getOrDefault(appointment.getId(), List.of()),
                        servicesById
                )
        ));
    }

    private Map<UUID, PetServiceCatalog> loadServiceCatalogMap(UUID tenantId, Collection<UUID> serviceIds) {
        if (serviceIds.isEmpty()) {
            return Map.of();
        }

        return petServiceCatalogRepository.findAllByTenantIdAndIdIn(tenantId, serviceIds)
                .stream()
                .collect(Collectors.toMap(PetServiceCatalog::getId, Function.identity()));
    }

    private List<PetAppointmentServiceLineResponse> resolveAppointmentServiceResponses(
            PetAppointment appointment,
            List<PetAppointmentServiceLine> lines,
            Map<UUID, PetServiceCatalog> servicesById
    ) {
        if (!lines.isEmpty()) {
            return lines.stream()
                    .map(line -> toAppointmentServiceResponse(
                            line,
                            servicesById.get(line.getServiceId()),
                            appointment,
                            lines.size()
                    ))
                    .toList();
        }

        if (appointment.getServiceId() == null) {
            return List.of();
        }

        PetServiceCatalog serviceCatalog = servicesById.get(appointment.getServiceId());
        return List.of(new PetAppointmentServiceLineResponse(
                null,
                appointment.getServiceId(),
                appointment.getServiceName(),
                serviceCatalog == null ? null : serviceCatalog.getCategory(),
                serviceCatalog == null ? null : serviceCatalog.getDurationMinutes(),
                appointment.getServicePrice(),
                serviceCatalog == null ? null : serviceCatalog.isCommissionEligible(),
                null,
                serviceCatalog != null && serviceCatalog.isCommissionEligible() ? appointment.getCommissionAmount() : null,
                serviceCatalog != null && serviceCatalog.isActive(),
                serviceCatalog != null && serviceCatalog.isAllowInPlans(),
                serviceCatalog != null && serviceCatalog.isAllowStandaloneBooking(),
                0,
                true,
                serviceCatalog == null
        ));
    }

    private PetAppointmentServiceLineResponse toAppointmentServiceResponse(
            PetAppointmentServiceLine line,
            PetServiceCatalog serviceCatalog,
            PetAppointment appointment,
            int serviceLineCount
    ) {
        Boolean commissionEligible = line.getCommissionEligible() != null
                ? line.getCommissionEligible()
                : (serviceCatalog == null ? null : serviceCatalog.isCommissionEligible());
        BigDecimal commissionAmount = line.getCommissionAmount();
        if (commissionAmount == null
                && serviceLineCount == 1
                && Boolean.TRUE.equals(commissionEligible)
                && appointment.getCommissionAmount() != null) {
            commissionAmount = appointment.getCommissionAmount();
        }

        return new PetAppointmentServiceLineResponse(
                line.getId(),
                line.getServiceId(),
                line.getServiceName(),
                line.getServiceCategory(),
                line.getDurationMinutes(),
                line.getServicePrice(),
                commissionEligible,
                line.getCommissionRate(),
                commissionAmount,
                serviceCatalog != null && serviceCatalog.isActive(),
                serviceCatalog != null && serviceCatalog.isAllowInPlans(),
                serviceCatalog != null && serviceCatalog.isAllowStandaloneBooking(),
                line.getLineOrder(),
                line.getLineOrder() == 0 || Objects.equals(line.getServiceId(), appointment.getServiceId()),
                serviceCatalog == null
        );
    }

    private Integer resolveTotalServiceDurationMinutes(List<PetAppointmentServiceLineResponse> appointmentServices) {
        int total = appointmentServices.stream()
                .map(PetAppointmentServiceLineResponse::durationMinutes)
                .filter(Objects::nonNull)
                .reduce(0, Integer::sum);
        return total > 0 ? total : null;
    }

    private BigDecimal resolveTotalServiceBasePrice(
            List<PetAppointmentServiceLineResponse> appointmentServices,
            BigDecimal fallbackBasePrice
    ) {
        List<BigDecimal> basePrices = appointmentServices.stream()
                .map(PetAppointmentServiceLineResponse::basePrice)
                .filter(Objects::nonNull)
                .toList();

        if (!basePrices.isEmpty()) {
            return basePrices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        return fallbackBasePrice;
    }

    private List<AppointmentServiceLineSelection> buildAppointmentServiceLineSelections(
            List<PetServiceCatalog> selectedServices,
            PetProfessional professional,
            BigDecimal appointmentServicePrice,
            boolean servicePriceOverridden
    ) {
        List<BigDecimal> linePrices = resolveServiceLinePrices(
                selectedServices,
                appointmentServicePrice,
                servicePriceOverridden
        );

        return java.util.stream.IntStream.range(0, selectedServices.size())
                .mapToObj(index -> {
                    PetServiceCatalog serviceCatalog = selectedServices.get(index);
                    BigDecimal linePrice = linePrices.get(index);
                    boolean commissionEligible = serviceCatalog.isCommissionEligible();
                    BigDecimal commissionRate = commissionEligible ? professional.getCommissionRate() : null;
                    BigDecimal commissionAmount = commissionRate != null && linePrice != null
                            ? normalizeCurrency(linePrice.multiply(commissionRate))
                            : null;

                    return new AppointmentServiceLineSelection(
                            serviceCatalog,
                            index,
                            linePrice,
                            commissionEligible,
                            commissionRate,
                            commissionAmount
                    );
                })
                .toList();
    }

    private List<BigDecimal> resolveServiceLinePrices(
            List<PetServiceCatalog> selectedServices,
            BigDecimal appointmentServicePrice,
            boolean servicePriceOverridden
    ) {
        if (!servicePriceOverridden || appointmentServicePrice == null) {
            return selectedServices.stream()
                    .map(PetServiceCatalog::getPrice)
                    .map(this::normalizeCurrency)
                    .toList();
        }

        if (selectedServices.size() == 1) {
            return List.of(normalizeCurrency(appointmentServicePrice));
        }

        List<BigDecimal> catalogPrices = selectedServices.stream()
                .map(PetServiceCatalog::getPrice)
                .map(this::normalizeCurrency)
                .toList();
        BigDecimal totalCatalogPrice = catalogPrices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalCatalogPrice.compareTo(BigDecimal.ZERO) > 0) {
            return distributeAmountProportionally(normalizeCurrency(appointmentServicePrice), catalogPrices, totalCatalogPrice);
        }

        return distributeAmountEvenly(normalizeCurrency(appointmentServicePrice), selectedServices.size());
    }

    private List<BigDecimal> distributeAmountProportionally(
            BigDecimal totalAmount,
            List<BigDecimal> weights,
            BigDecimal totalWeight
    ) {
        Map<Integer, BigDecimal> distributed = new LinkedHashMap<>();
        BigDecimal allocated = BigDecimal.ZERO;

        for (int index = 0; index < weights.size(); index++) {
            BigDecimal amount = index == weights.size() - 1
                    ? totalAmount.subtract(allocated)
                    : totalAmount.multiply(weights.get(index)).divide(totalWeight, 2, RoundingMode.DOWN);
            amount = normalizeCurrency(amount);
            distributed.put(index, amount);
            allocated = allocated.add(amount);
        }

        return List.copyOf(distributed.values());
    }

    private List<BigDecimal> distributeAmountEvenly(BigDecimal totalAmount, int lineCount) {
        Map<Integer, BigDecimal> distributed = new LinkedHashMap<>();
        BigDecimal share = totalAmount.divide(BigDecimal.valueOf(lineCount), 2, RoundingMode.DOWN);
        BigDecimal allocated = BigDecimal.ZERO;

        for (int index = 0; index < lineCount; index++) {
            BigDecimal amount = index == lineCount - 1
                    ? totalAmount.subtract(allocated)
                    : share;
            amount = normalizeCurrency(amount);
            distributed.put(index, amount);
            allocated = allocated.add(amount);
        }

        return List.copyOf(distributed.values());
    }

    private BigDecimal resolveAppointmentCommissionAmount(List<AppointmentServiceLineSelection> serviceLines) {
        List<BigDecimal> commissionAmounts = serviceLines.stream()
                .map(AppointmentServiceLineSelection::commissionAmount)
                .filter(Objects::nonNull)
                .toList();

        if (commissionAmounts.isEmpty()) {
            return null;
        }

        return normalizeCurrency(commissionAmounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private BigDecimal normalizeCurrency(BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private record AppointmentServiceSelection(List<AppointmentServiceLineSelection> services) {
    }

    private record AppointmentServiceLineSelection(
            PetServiceCatalog serviceCatalog,
            int lineOrder,
            BigDecimal servicePrice,
            boolean commissionEligible,
            BigDecimal commissionRate,
            BigDecimal commissionAmount
    ) {
    }
}

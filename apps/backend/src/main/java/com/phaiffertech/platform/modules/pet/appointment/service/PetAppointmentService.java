package com.phaiffertech.platform.modules.pet.appointment.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.core.inventory.repository.InventoryItemRepository;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLine;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLineInventoryPlan;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentCreateRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentServiceLineAssignmentRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentServiceLineInventoryResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentServiceLineResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentUpdateRequest;
import com.phaiffertech.platform.modules.pet.appointment.mapper.PetAppointmentMapper;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentServiceLineInventoryPlanRepository;
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
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryLink;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceInventoryLinkRepository;
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
import java.util.Optional;
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
    private final PetAppointmentServiceLineInventoryPlanRepository appointmentServiceLineInventoryPlanRepository;
    private final PetClientRepository petClientRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetServiceCatalogRepository petServiceCatalogRepository;
    private final PetServiceInventoryLinkRepository serviceInventoryLinkRepository;
    private final InventoryItemRepository inventoryItemRepository;
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
            PetAppointmentServiceLineInventoryPlanRepository appointmentServiceLineInventoryPlanRepository,
            PetClientRepository petClientRepository,
            PetProfileRepository petProfileRepository,
            PetServiceCatalogRepository petServiceCatalogRepository,
            PetServiceInventoryLinkRepository serviceInventoryLinkRepository,
            InventoryItemRepository inventoryItemRepository,
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
        this.appointmentServiceLineInventoryPlanRepository = appointmentServiceLineInventoryPlanRepository;
        this.petClientRepository = petClientRepository;
        this.petProfileRepository = petProfileRepository;
        this.petServiceCatalogRepository = petServiceCatalogRepository;
        this.serviceInventoryLinkRepository = serviceInventoryLinkRepository;
        this.inventoryItemRepository = inventoryItemRepository;
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
                request.serviceLineAssignments(),
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
                request.serviceLineAssignments(),
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
            List<PetAppointmentServiceLineAssignmentRequest> requestedServiceLineAssignments,
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

        AppointmentProfessionalSelection professionalSelection = resolveProfessionalSelection(
                tenantId,
                professionalId,
                resolvedServiceIds,
                requestedServiceLineAssignments
        );
        Map<UUID, List<AppointmentServiceInventorySelection>> serviceInventoryByServiceId =
                loadServiceInventorySelectionsByServiceId(tenantId, resolvedServiceIds);

        PetServiceCatalog primaryService = selectedServices.getFirst();
        entity.setServiceId(primaryService.getId());
        entity.setServiceName(resolveAppointmentServiceHeadline(selectedServices));
        entity.setProfessionalId(professionalSelection.compatibilityProfessional().getId());

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
                professionalSelection,
                resolvedServicePrice,
                requestedServicePrice != null,
                serviceInventoryByServiceId
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
        List<PetAppointmentServiceLine> appointmentLines = appointmentServiceLineRepository
                .findAllByTenantIdAndAppointmentIdOrderByLineOrderAsc(tenantId, appointment.getId());
        List<UUID> currentServiceIds = resolveCurrentServiceIds(appointment, appointmentLines);
        Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> lineInventoryByLineId = loadLineInventoryByLineId(
                tenantId,
                appointmentLines.stream().map(PetAppointmentServiceLine::getId).filter(Objects::nonNull).toList()
        );
        Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> serviceInventoryByServiceId = loadServiceInventoryPreviewByServiceId(
                tenantId,
                currentServiceIds
        );
        List<PetAppointmentServiceLineResponse> appointmentServices = resolveAppointmentServiceResponses(
                appointment,
                appointmentLines,
                loadServiceCatalogMap(tenantId, currentServiceIds),
                lineInventoryByLineId,
                serviceInventoryByServiceId
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
                || !java.util.Objects.equals(
                        currentAppointment.getProfessionalId(),
                        resolveRequestedCompatibilityProfessionalId(request)
                );

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

        List<PetAppointmentServiceLineInventoryPlan> inventoryPlans = new java.util.ArrayList<>();
        for (int index = 0; index < lines.size(); index++) {
            PetAppointmentServiceLine line = lines.get(index);
            AppointmentServiceLineSelection selection = selectedServices.get(index);
            selection.expectedInventoryConsumptions().forEach(consumption ->
                    inventoryPlans.add(buildAppointmentServiceLineInventoryPlan(tenantId, line, consumption))
            );
        }
        if (!inventoryPlans.isEmpty()) {
            appointmentServiceLineInventoryPlanRepository.saveAll(inventoryPlans);
        }
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
        line.setProfessionalId(selection.professionalId());
        line.setProfessionalName(selection.professionalName());
        line.setCommissionEligible(selection.commissionEligible());
        line.setCommissionRate(selection.commissionRate());
        line.setCommissionAmount(selection.commissionAmount());
        return line;
    }

    private PetAppointmentServiceLineInventoryPlan buildAppointmentServiceLineInventoryPlan(
            UUID tenantId,
            PetAppointmentServiceLine line,
            AppointmentServiceInventorySelection selection
    ) {
        PetAppointmentServiceLineInventoryPlan plan = new PetAppointmentServiceLineInventoryPlan();
        plan.setTenantId(tenantId);
        plan.setAppointmentServiceId(line.getId());
        plan.setInventoryItemId(selection.inventoryItemId());
        plan.setInventoryItemName(selection.inventoryItemName());
        plan.setInventoryItemSku(selection.inventoryItemSku());
        plan.setInventoryCategory(selection.inventoryCategory());
        plan.setUnitOfMeasure(selection.unitOfMeasure());
        plan.setExpectedQuantity(selection.expectedQuantity());
        plan.setConsumptionRule(selection.consumptionRule());
        return plan;
    }

    private List<UUID> resolveCurrentServiceIds(UUID tenantId, PetAppointment appointment) {
        List<PetAppointmentServiceLine> lines = appointmentServiceLineRepository.findAllByTenantIdAndAppointmentIdOrderByLineOrderAsc(
                tenantId,
                appointment.getId()
        );
        return resolveCurrentServiceIds(appointment, lines);
    }

    private List<UUID> resolveCurrentServiceIds(PetAppointment appointment, List<PetAppointmentServiceLine> lines) {
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
        Set<UUID> lineIds = new LinkedHashSet<>();
        appointments.forEach(appointment -> {
            List<PetAppointmentServiceLine> lines = linesByAppointmentId.get(appointment.getId());
            if (lines == null || lines.isEmpty()) {
                if (appointment.getServiceId() != null) {
                    serviceIds.add(appointment.getServiceId());
                }
                return;
            }
            lines.forEach(line -> {
                serviceIds.add(line.getServiceId());
                if (line.getId() != null) {
                    lineIds.add(line.getId());
                }
            });
        });

        Map<UUID, PetServiceCatalog> servicesById = loadServiceCatalogMap(tenantId, serviceIds);
        Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> lineInventoryByLineId = loadLineInventoryByLineId(
                tenantId,
                lineIds
        );
        Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> serviceInventoryByServiceId = loadServiceInventoryPreviewByServiceId(
                tenantId,
                serviceIds
        );

        return appointments.stream().collect(Collectors.toMap(
                PetAppointment::getId,
                appointment -> resolveAppointmentServiceResponses(
                        appointment,
                        linesByAppointmentId.getOrDefault(appointment.getId(), List.of()),
                        servicesById,
                        lineInventoryByLineId,
                        serviceInventoryByServiceId
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

    private Map<UUID, List<AppointmentServiceInventorySelection>> loadServiceInventorySelectionsByServiceId(
            UUID tenantId,
            Collection<UUID> serviceIds
    ) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            return Map.of();
        }

        List<PetServiceInventoryLink> links = serviceInventoryLinkRepository
                .findAllByTenantIdAndServiceIdInAndActiveTrueOrderByServiceIdAscCreatedAtAsc(tenantId, serviceIds);
        if (links.isEmpty()) {
            return Map.of();
        }

        Map<UUID, InventoryItem> itemsById = loadInventoryItemMapIncludingDeleted(
                tenantId,
                links.stream().map(PetServiceInventoryLink::getInventoryItemId).collect(Collectors.toSet())
        );

        Map<UUID, List<AppointmentServiceInventorySelection>> grouped = new LinkedHashMap<>();
        for (PetServiceInventoryLink link : links) {
            grouped.computeIfAbsent(link.getServiceId(), ignored -> new java.util.ArrayList<>())
                    .add(toServiceInventorySelection(link, itemsById.get(link.getInventoryItemId())));
        }
        return grouped;
    }

    private Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> loadServiceInventoryPreviewByServiceId(
            UUID tenantId,
            Collection<UUID> serviceIds
    ) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            return Map.of();
        }

        Map<UUID, List<AppointmentServiceInventorySelection>> selectionsByServiceId =
                loadServiceInventorySelectionsByServiceId(tenantId, serviceIds);
        if (selectionsByServiceId.isEmpty()) {
            return Map.of();
        }

        Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> grouped = new LinkedHashMap<>();
        selectionsByServiceId.forEach((serviceId, selections) -> grouped.put(
                serviceId,
                selections.stream().map(this::toInventoryPreviewResponse).toList()
        ));
        return grouped;
    }

    private Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> loadLineInventoryByLineId(
            UUID tenantId,
            Collection<UUID> lineIds
    ) {
        if (lineIds == null || lineIds.isEmpty()) {
            return Map.of();
        }

        List<PetAppointmentServiceLineInventoryPlan> plans = appointmentServiceLineInventoryPlanRepository
                .findAllByTenantIdAndAppointmentServiceIdInOrderByAppointmentServiceIdAscCreatedAtAsc(tenantId, lineIds);
        if (plans.isEmpty()) {
            return Map.of();
        }

        Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> grouped = new LinkedHashMap<>();
        for (PetAppointmentServiceLineInventoryPlan plan : plans) {
            grouped.computeIfAbsent(plan.getAppointmentServiceId(), ignored -> new java.util.ArrayList<>())
                    .add(new PetAppointmentServiceLineInventoryResponse(
                            plan.getInventoryItemId(),
                            plan.getInventoryItemName(),
                            plan.getInventoryItemSku(),
                            plan.getInventoryCategory(),
                            plan.getUnitOfMeasure(),
                            plan.getExpectedQuantity(),
                            plan.getConsumptionRule()
                    ));
        }
        return grouped;
    }

    private Map<UUID, InventoryItem> loadInventoryItemMapIncludingDeleted(
            UUID tenantId,
            Collection<UUID> inventoryItemIds
    ) {
        if (inventoryItemIds == null || inventoryItemIds.isEmpty()) {
            return Map.of();
        }

        return inventoryItemRepository.findAllByTenantIdAndIdInIncludingDeleted(tenantId, inventoryItemIds)
                .stream()
                .collect(Collectors.toMap(InventoryItem::getId, Function.identity()));
    }

    private AppointmentServiceInventorySelection toServiceInventorySelection(PetServiceInventoryLink link, InventoryItem item) {
        return new AppointmentServiceInventorySelection(
                link.getInventoryItemId(),
                item == null ? "Unavailable inventory item" : item.getName(),
                item == null ? "UNAVAILABLE" : item.getSku(),
                item == null || item.getCategory() == null ? "UNKNOWN" : item.getCategory().name(),
                item == null ? "UNIT" : item.getUnitOfMeasure(),
                link.getExpectedQuantity(),
                link.getConsumptionRule()
        );
    }

    private PetAppointmentServiceLineInventoryResponse toInventoryPreviewResponse(
            AppointmentServiceInventorySelection selection
    ) {
        return new PetAppointmentServiceLineInventoryResponse(
                selection.inventoryItemId(),
                selection.inventoryItemName(),
                selection.inventoryItemSku(),
                selection.inventoryCategory(),
                selection.unitOfMeasure(),
                selection.expectedQuantity(),
                selection.consumptionRule()
        );
    }

    private List<PetAppointmentServiceLineResponse> resolveAppointmentServiceResponses(
            PetAppointment appointment,
            List<PetAppointmentServiceLine> lines,
            Map<UUID, PetServiceCatalog> servicesById,
            Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> lineInventoryByLineId,
            Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> serviceInventoryByServiceId
    ) {
        if (!lines.isEmpty()) {
            return lines.stream()
                    .map(line -> toAppointmentServiceResponse(
                            line,
                            servicesById.get(line.getServiceId()),
                            appointment,
                            lines.size(),
                            lineInventoryByLineId.getOrDefault(line.getId(), List.of()),
                            serviceInventoryByServiceId.getOrDefault(line.getServiceId(), List.of())
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
                appointment.getProfessionalId(),
                appointment.getProfessionalId() == null ? null : resolveProfessionalName(
                        petProfessionalRepository.findByIdAndTenantId(appointment.getProfessionalId(), appointment.getTenantId()).orElse(null)
                ),
                serviceCatalog == null ? null : serviceCatalog.isCommissionEligible(),
                null,
                serviceCatalog != null && serviceCatalog.isCommissionEligible() ? appointment.getCommissionAmount() : null,
                serviceInventoryByServiceId.getOrDefault(appointment.getServiceId(), List.of()),
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
            int serviceLineCount,
            List<PetAppointmentServiceLineInventoryResponse> storedInventoryConsumptions,
            List<PetAppointmentServiceLineInventoryResponse> fallbackInventoryConsumptions
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
        List<PetAppointmentServiceLineInventoryResponse> expectedInventoryConsumptions = storedInventoryConsumptions.isEmpty()
                ? fallbackInventoryConsumptions
                : storedInventoryConsumptions;

        return new PetAppointmentServiceLineResponse(
                line.getId(),
                line.getServiceId(),
                line.getServiceName(),
                line.getServiceCategory(),
                line.getDurationMinutes(),
                line.getServicePrice(),
                line.getProfessionalId(),
                line.getProfessionalName(),
                commissionEligible,
                line.getCommissionRate(),
                commissionAmount,
                expectedInventoryConsumptions,
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
            AppointmentProfessionalSelection professionalSelection,
            BigDecimal appointmentServicePrice,
            boolean servicePriceOverridden,
            Map<UUID, List<AppointmentServiceInventorySelection>> serviceInventoryByServiceId
    ) {
        List<BigDecimal> linePrices = resolveServiceLinePrices(
                selectedServices,
                appointmentServicePrice,
                servicePriceOverridden
        );

        return java.util.stream.IntStream.range(0, selectedServices.size())
                .mapToObj(index -> {
                    PetServiceCatalog serviceCatalog = selectedServices.get(index);
                    PetProfessional lineProfessional = professionalSelection.serviceLineProfessionals()
                            .getOrDefault(serviceCatalog.getId(), professionalSelection.defaultProfessional());
                    BigDecimal linePrice = linePrices.get(index);
                    boolean commissionEligible = serviceCatalog.isCommissionEligible();
                    BigDecimal commissionRate = commissionEligible && lineProfessional != null
                            ? lineProfessional.getCommissionRate()
                            : null;
                    BigDecimal commissionAmount = commissionRate != null && linePrice != null
                            ? normalizeCurrency(linePrice.multiply(commissionRate))
                            : null;

                    return new AppointmentServiceLineSelection(
                            serviceCatalog,
                            index,
                            linePrice,
                            lineProfessional == null ? null : lineProfessional.getId(),
                            lineProfessional == null ? null : lineProfessional.getName(),
                            commissionEligible,
                            commissionRate,
                            commissionAmount,
                            serviceInventoryByServiceId.getOrDefault(serviceCatalog.getId(), List.of())
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

    private UUID resolveRequestedCompatibilityProfessionalId(PetAppointmentUpdateRequest request) {
        List<UUID> selectedServiceIds = resolveRequestedServiceIds(request.serviceId(), request.serviceIds());
        Map<UUID, PetAppointmentServiceLineAssignmentRequest> assignmentsByServiceId = resolveRequestedServiceLineAssignments(
                selectedServiceIds,
                request.serviceLineAssignments()
        );
        PetAppointmentServiceLineAssignmentRequest primaryAssignment = assignmentsByServiceId.get(selectedServiceIds.getFirst());
        if (primaryAssignment != null && primaryAssignment.professionalId() != null) {
            return primaryAssignment.professionalId();
        }
        return request.professionalId();
    }

    private BigDecimal normalizeCurrency(BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private AppointmentProfessionalSelection resolveProfessionalSelection(
            UUID tenantId,
            UUID defaultProfessionalId,
            List<UUID> selectedServiceIds,
            List<PetAppointmentServiceLineAssignmentRequest> requestedServiceLineAssignments
    ) {
        PetProfessional defaultProfessional = petProfessionalRepository.findByIdAndTenantId(defaultProfessionalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet professional not found for tenant."));

        Map<UUID, PetAppointmentServiceLineAssignmentRequest> assignmentsByServiceId = resolveRequestedServiceLineAssignments(
                selectedServiceIds,
                requestedServiceLineAssignments
        );

        Set<UUID> professionalIds = new LinkedHashSet<>();
        professionalIds.add(defaultProfessionalId);
        assignmentsByServiceId.values().stream()
                .map(PetAppointmentServiceLineAssignmentRequest::professionalId)
                .filter(Objects::nonNull)
                .forEach(professionalIds::add);

        Map<UUID, PetProfessional> professionalsById = petProfessionalRepository.findAllByTenantIdAndIdIn(tenantId, professionalIds)
                .stream()
                .collect(Collectors.toMap(PetProfessional::getId, Function.identity()));

        if (professionalsById.size() != professionalIds.size()) {
            throw new ResourceNotFoundException("Pet professional not found for tenant.");
        }

        Map<UUID, PetProfessional> serviceLineProfessionals = new LinkedHashMap<>();
        for (UUID serviceId : selectedServiceIds) {
            PetAppointmentServiceLineAssignmentRequest assignment = assignmentsByServiceId.get(serviceId);
            if (assignment == null) {
                serviceLineProfessionals.put(serviceId, defaultProfessional);
                continue;
            }

            serviceLineProfessionals.put(
                    serviceId,
                    assignment.professionalId() == null ? null : professionalsById.get(assignment.professionalId())
            );
        }

        PetProfessional compatibilityProfessional = Optional.ofNullable(serviceLineProfessionals.get(selectedServiceIds.getFirst()))
                .orElse(defaultProfessional);

        return new AppointmentProfessionalSelection(defaultProfessional, compatibilityProfessional, serviceLineProfessionals);
    }

    private Map<UUID, PetAppointmentServiceLineAssignmentRequest> resolveRequestedServiceLineAssignments(
            List<UUID> selectedServiceIds,
            List<PetAppointmentServiceLineAssignmentRequest> requestedServiceLineAssignments
    ) {
        if (requestedServiceLineAssignments == null || requestedServiceLineAssignments.isEmpty()) {
            return Map.of();
        }

        Set<UUID> selectedServiceIdSet = new LinkedHashSet<>(selectedServiceIds);
        Map<UUID, PetAppointmentServiceLineAssignmentRequest> assignmentsByServiceId = new LinkedHashMap<>();

        for (PetAppointmentServiceLineAssignmentRequest assignment : requestedServiceLineAssignments) {
            if (!selectedServiceIdSet.contains(assignment.serviceId())) {
                throw new ConflictOperationException(
                        "Pet appointment service line assignment must reference a selected service."
                );
            }

            PetAppointmentServiceLineAssignmentRequest previous = assignmentsByServiceId.put(assignment.serviceId(), assignment);
            if (previous != null) {
                throw new ConflictOperationException(
                        "Pet appointment cannot assign more than one professional entry to the same service line."
                );
            }
        }

        return assignmentsByServiceId;
    }

    private record AppointmentServiceSelection(List<AppointmentServiceLineSelection> services) {
    }

    private record AppointmentServiceInventorySelection(
            UUID inventoryItemId,
            String inventoryItemName,
            String inventoryItemSku,
            String inventoryCategory,
            String unitOfMeasure,
            BigDecimal expectedQuantity,
            com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryConsumptionRule consumptionRule
    ) {
    }

    private record AppointmentProfessionalSelection(
            PetProfessional defaultProfessional,
            PetProfessional compatibilityProfessional,
            Map<UUID, PetProfessional> serviceLineProfessionals
    ) {
    }

    private record AppointmentServiceLineSelection(
            PetServiceCatalog serviceCatalog,
            int lineOrder,
            BigDecimal servicePrice,
            UUID professionalId,
            String professionalName,
            boolean commissionEligible,
            BigDecimal commissionRate,
            BigDecimal commissionAmount,
            List<AppointmentServiceInventorySelection> expectedInventoryConsumptions
    ) {
    }
}

package com.phaiffertech.platform.modules.pet.appointment.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovement;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementSource;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementType;
import com.phaiffertech.platform.core.inventory.repository.InventoryItemRepository;
import com.phaiffertech.platform.core.inventory.service.InventoryMovementCommand;
import com.phaiffertech.platform.core.inventory.service.InventoryMovementService;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentInventoryConsumptionStatus;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentInventoryVarianceStatus;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLine;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointmentServiceLineInventoryPlan;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentCreateRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentServiceLineInventoryActualRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentServiceLineInventoryActualUpdateRequest;
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
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryConsumptionRule;
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
import com.phaiffertech.platform.shared.security.CurrentUserService;
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
    private final InventoryMovementService inventoryMovementService;
    private final PetProfessionalRepository petProfessionalRepository;
    private final PetMedicalRecordRepository petMedicalRecordRepository;
    private final PetVaccinationRepository petVaccinationRepository;
    private final PetPrescriptionRepository petPrescriptionRepository;
    private final PlatformMetricsService platformMetricsService;
    private final ClientPlanRepository clientPlanRepository;
    private final PetOperationalTriggerService operationalTriggerService;
    private final PetServiceCatalogCategoryPolicyService serviceCatalogCategoryPolicyService;
    private final CurrentUserService currentUserService;

    public PetAppointmentService(
            PetAppointmentRepository repository,
            PetAppointmentServiceLineRepository appointmentServiceLineRepository,
            PetAppointmentServiceLineInventoryPlanRepository appointmentServiceLineInventoryPlanRepository,
            PetClientRepository petClientRepository,
            PetProfileRepository petProfileRepository,
            PetServiceCatalogRepository petServiceCatalogRepository,
            PetServiceInventoryLinkRepository serviceInventoryLinkRepository,
            InventoryItemRepository inventoryItemRepository,
            InventoryMovementService inventoryMovementService,
            PetProfessionalRepository petProfessionalRepository,
            PetMedicalRecordRepository petMedicalRecordRepository,
            PetVaccinationRepository petVaccinationRepository,
            PetPrescriptionRepository petPrescriptionRepository,
            PlatformMetricsService platformMetricsService,
            ClientPlanRepository clientPlanRepository,
            PetOperationalTriggerService operationalTriggerService,
            PetServiceCatalogCategoryPolicyService serviceCatalogCategoryPolicyService,
            CurrentUserService currentUserService
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
        this.inventoryMovementService = inventoryMovementService;
        this.petProfessionalRepository = petProfessionalRepository;
        this.petMedicalRecordRepository = petMedicalRecordRepository;
        this.petVaccinationRepository = petVaccinationRepository;
        this.petPrescriptionRepository = petPrescriptionRepository;
        this.platformMetricsService = platformMetricsService;
        this.clientPlanRepository = clientPlanRepository;
        this.operationalTriggerService = operationalTriggerService;
        this.serviceCatalogCategoryPolicyService = serviceCatalogCategoryPolicyService;
        this.currentUserService = currentUserService;
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
                Map.of(),
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
        List<PetAppointmentServiceLine> existingServiceLines = appointmentServiceLineRepository
                .findAllByTenantIdAndAppointmentIdOrderByLineOrderAsc(tenantId, entity.getId());

        ensureLinkedClinicalEntriesAllowUpdate(tenantId, entity, request);

        UUID previousClientPlanId = entity.getClientPlanId();
        List<UUID> previousServiceIds = resolveCurrentServiceIds(entity, existingServiceLines);
        Map<UUID, List<AppointmentServiceInventorySelection>> persistedServiceInventoryByServiceId =
                loadStoredServiceInventorySelectionsByServiceId(tenantId, entity.getId());
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
                persistedServiceInventoryByServiceId,
                entity
        );

        // Consume a plan session when appointment transitions to COMPLETED for the first time.
        tryConsumePlanSession(tenantId, entity);

        PetAppointment saved = repository.save(entity);
        reconcileAppointmentServiceLines(tenantId, saved, existingServiceLines, selection.services());
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
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_appointment_service_inventory")
    public PetAppointmentResponse updateServiceLineInventoryConsumptions(
            UUID appointmentId,
            UUID serviceLineId,
            PetAppointmentServiceLineInventoryActualUpdateRequest request
    ) {
        UUID tenantId = currentTenantId();
        PetAppointment appointment = getOrThrow(appointmentId, tenantId);
        PetAppointmentServiceLine serviceLine = appointmentServiceLineRepository
                .findByIdAndTenantIdAndAppointmentId(serviceLineId, tenantId, appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet appointment service line not found."));

        List<PetAppointmentServiceLineInventoryPlan> plans = appointmentServiceLineInventoryPlanRepository
                .findAllByTenantIdAndAppointmentServiceIdOrderByCreatedAtAsc(tenantId, serviceLine.getId());

        if (plans.isEmpty()) {
            throw new ConflictOperationException(
                    "Pet appointment service line does not have a structured inventory snapshot to capture actual consumption."
            );
        }

        Map<UUID, PetAppointmentServiceLineInventoryActualRequest> requestsByInventoryItemId =
                mapActualConsumptionRequests(request.inventoryConsumptions());
        Set<UUID> planInventoryItemIds = plans.stream()
                .map(PetAppointmentServiceLineInventoryPlan::getInventoryItemId)
                .collect(Collectors.toSet());

        if (!planInventoryItemIds.containsAll(requestsByInventoryItemId.keySet())) {
            throw new ConflictOperationException(
                    "Pet appointment actual consumption update can only touch inventory items from the stored service-line snapshot."
            );
        }

        for (PetAppointmentServiceLineInventoryPlan plan : plans) {
            PetAppointmentServiceLineInventoryActualRequest lineRequest =
                    requestsByInventoryItemId.get(plan.getInventoryItemId());
            if (lineRequest == null) {
                continue;
            }
            applyActualConsumption(plan, lineRequest);
        }

        appointmentServiceLineInventoryPlanRepository.saveAll(plans);
        return toValidatedResponse(appointment, tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_appointment_service_inventory")
    public PetAppointmentResponse applyServiceLineInventoryConsumption(
            UUID appointmentId,
            UUID serviceLineId,
            UUID inventoryConsumptionId
    ) {
        UUID tenantId = currentTenantId();
        PetAppointment appointment = getOrThrow(appointmentId, tenantId);
        PetAppointmentServiceLine serviceLine = appointmentServiceLineRepository
                .findByIdAndTenantIdAndAppointmentId(serviceLineId, tenantId, appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet appointment service line not found."));
        PetAppointmentServiceLineInventoryPlan inventoryRow = appointmentServiceLineInventoryPlanRepository
                .findLockedByIdAndTenantIdAndAppointmentServiceId(inventoryConsumptionId, tenantId, serviceLineId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet appointment inventory row not found."));

        if (inventoryRow.getAppliedInventoryMovementId() != null) {
            return toValidatedResponse(appointment, tenantId);
        }

        int quantityToApply = resolveStockApplicationQuantity(inventoryRow);
        InventoryItem inventoryItem = inventoryItemRepository.findLockedByIdAndTenantId(inventoryRow.getInventoryItemId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for tenant."));
        if (inventoryItem.getCurrentQuantity() < quantityToApply) {
            throw new ConflictOperationException(
                    "Insufficient stock to apply the recorded appointment usage for " + inventoryRow.getInventoryItemName() + "."
            );
        }

        InventoryMovement movement = inventoryMovementService.createMovement(
                tenantId,
                new InventoryMovementCommand(
                        inventoryRow.getInventoryItemId(),
                        InventoryMovementType.OUT,
                        quantityToApply,
                        InventoryMovementSource.PET_APPOINTMENT_SERVICE_CONSUMPTION,
                        inventoryRow.getId(),
                        buildStockApplicationReason(serviceLine, inventoryRow)
                )
        );

        inventoryRow.setAppliedInventoryMovementId(movement.getId());
        inventoryRow.setStockAppliedAt(Instant.now());
        inventoryRow.setStockAppliedBy(resolveCurrentOperatorEmail());
        appointmentServiceLineInventoryPlanRepository.save(inventoryRow);

        return toValidatedResponse(appointment, tenantId);
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
            Map<UUID, List<AppointmentServiceInventorySelection>> persistedServiceInventoryByServiceId,
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
                loadServiceInventorySelectionsByServiceId(
                        tenantId,
                        resolvedServiceIds,
                        previousServiceIdSet,
                        persistedServiceInventoryByServiceId
                );

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

    private void reconcileAppointmentServiceLines(
            UUID tenantId,
            PetAppointment appointment,
            List<PetAppointmentServiceLine> existingLines,
            List<AppointmentServiceLineSelection> selectedServices
    ) {
        if (canReuseExistingServiceLines(existingLines, selectedServices)) {
            updateAppointmentServiceLinesInPlace(existingLines, selectedServices);
            return;
        }
        if (hasAppliedInventoryConsumptions(tenantId, existingLines)) {
            throw new ConflictOperationException(
                    "Pet appointment services with applied stock cannot change until a dedicated reversal flow exists."
            );
        }
        replaceAppointmentServiceLines(tenantId, appointment, selectedServices);
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

    private boolean canReuseExistingServiceLines(
            List<PetAppointmentServiceLine> existingLines,
            List<AppointmentServiceLineSelection> selectedServices
    ) {
        if (existingLines.isEmpty() || existingLines.size() != selectedServices.size()) {
            return false;
        }
        for (int index = 0; index < existingLines.size(); index++) {
            PetAppointmentServiceLine existingLine = existingLines.get(index);
            AppointmentServiceLineSelection selection = selectedServices.get(index);
            if (!Objects.equals(existingLine.getServiceId(), selection.serviceCatalog().getId())
                    || existingLine.getLineOrder() != selection.lineOrder()) {
                return false;
            }
        }
        return true;
    }

    private void updateAppointmentServiceLinesInPlace(
            List<PetAppointmentServiceLine> existingLines,
            List<AppointmentServiceLineSelection> selectedServices
    ) {
        for (int index = 0; index < existingLines.size(); index++) {
            PetAppointmentServiceLine line = existingLines.get(index);
            AppointmentServiceLineSelection selection = selectedServices.get(index);
            PetServiceCatalog serviceCatalog = selection.serviceCatalog();
            line.setServiceName(serviceCatalog.getName());
            line.setServiceCategory(serviceCatalog.getCategory());
            line.setDurationMinutes(serviceCatalog.getDurationMinutes());
            line.setServicePrice(selection.servicePrice());
            line.setProfessionalId(selection.professionalId());
            line.setProfessionalName(selection.professionalName());
            line.setCommissionEligible(selection.commissionEligible());
            line.setCommissionRate(selection.commissionRate());
            line.setCommissionAmount(selection.commissionAmount());
        }
        appointmentServiceLineRepository.saveAll(existingLines);
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
        plan.setActualQuantity(selection.actualQuantity());
        plan.setConsumptionStatus(selection.consumptionStatus());
        plan.setConsumptionRule(selection.consumptionRule());
        return plan;
    }

    private Map<UUID, PetAppointmentServiceLineInventoryActualRequest> mapActualConsumptionRequests(
            List<PetAppointmentServiceLineInventoryActualRequest> inventoryConsumptions
    ) {
        if (inventoryConsumptions == null || inventoryConsumptions.isEmpty()) {
            throw new ConflictOperationException("Pet appointment actual consumption update requires at least one inventory row.");
        }

        Map<UUID, PetAppointmentServiceLineInventoryActualRequest> requestsByInventoryItemId = new LinkedHashMap<>();
        for (PetAppointmentServiceLineInventoryActualRequest request : inventoryConsumptions) {
            PetAppointmentServiceLineInventoryActualRequest previous =
                    requestsByInventoryItemId.put(request.inventoryItemId(), request);
            if (previous != null) {
                throw new ConflictOperationException(
                        "Pet appointment actual consumption cannot repeat the same inventory item in one service line update."
                );
            }
        }
        return requestsByInventoryItemId;
    }

    private void applyActualConsumption(
            PetAppointmentServiceLineInventoryPlan plan,
            PetAppointmentServiceLineInventoryActualRequest request
    ) {
        NormalizedActualConsumption normalized = normalizeActualConsumption(request);
        if (plan.getAppliedInventoryMovementId() != null) {
            if (!matchesStoredActualConsumption(plan, normalized)) {
                throw new ConflictOperationException(
                        "Pet appointment inventory rows with applied stock cannot change actual usage without a dedicated reversal flow."
                );
            }
            return;
        }

        plan.setActualQuantity(normalized.actualQuantity());
        plan.setConsumptionStatus(normalized.consumptionStatus());
    }

    private NormalizedActualConsumption normalizeActualConsumption(
            PetAppointmentServiceLineInventoryActualRequest request
    ) {
        if (request.actualQuantity() != null && request.actualQuantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new ConflictOperationException("Pet appointment actual consumption quantity cannot be negative.");
        }

        BigDecimal normalizedActualQuantity = request.actualQuantity() == null
                ? null
                : request.actualQuantity().setScale(2, RoundingMode.HALF_UP);

        switch (request.consumptionStatus()) {
            case PLANNED -> {
                if (normalizedActualQuantity != null) {
                    throw new ConflictOperationException(
                            "Pet appointment planned inventory rows cannot store an actual quantity."
                    );
                }
                normalizedActualQuantity = null;
            }
            case SKIPPED -> normalizedActualQuantity = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            case ADJUSTED, READY_TO_APPLY -> {
                if (normalizedActualQuantity == null) {
                    throw new ConflictOperationException(
                            "Pet appointment actual consumption quantity is required for adjusted or ready-to-apply rows."
                    );
                }
            }
            default -> throw new ConflictOperationException("Pet appointment inventory consumption status is not supported.");
        }

        return new NormalizedActualConsumption(normalizedActualQuantity, request.consumptionStatus());
    }

    private boolean matchesStoredActualConsumption(
            PetAppointmentServiceLineInventoryPlan plan,
            NormalizedActualConsumption normalized
    ) {
        return plan.getConsumptionStatus() == normalized.consumptionStatus()
                && sameScaledQuantity(plan.getActualQuantity(), normalized.actualQuantity());
    }

    private boolean sameScaledQuantity(BigDecimal currentQuantity, BigDecimal requestedQuantity) {
        if (currentQuantity == null || requestedQuantity == null) {
            return currentQuantity == null && requestedQuantity == null;
        }
        return currentQuantity.compareTo(requestedQuantity) == 0;
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
            Collection<UUID> serviceIds,
            Collection<UUID> persistedServiceIds,
            Map<UUID, List<AppointmentServiceInventorySelection>> persistedServiceInventoryByServiceId
    ) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            return Map.of();
        }

        Set<UUID> persistedServiceIdSet = persistedServiceIds == null
                ? Set.of()
                : new LinkedHashSet<>(persistedServiceIds);
        List<PetServiceInventoryLink> links = serviceInventoryLinkRepository
                .findAllByTenantIdAndServiceIdInAndActiveTrueOrderByServiceIdAscCreatedAtAsc(tenantId, serviceIds);

        Map<UUID, List<AppointmentServiceInventorySelection>> grouped = new LinkedHashMap<>();
        for (UUID serviceId : serviceIds) {
            if (persistedServiceIdSet.contains(serviceId)) {
                grouped.put(serviceId, List.copyOf(
                        persistedServiceInventoryByServiceId.getOrDefault(serviceId, List.of())
                ));
            }
        }

        if (links.isEmpty()) {
            return grouped;
        }

        Map<UUID, InventoryItem> itemsById = loadInventoryItemMapIncludingDeleted(
                tenantId,
                links.stream().map(PetServiceInventoryLink::getInventoryItemId).collect(Collectors.toSet())
        );

        for (PetServiceInventoryLink link : links) {
            if (persistedServiceIdSet.contains(link.getServiceId())) {
                continue;
            }
            grouped.computeIfAbsent(link.getServiceId(), ignored -> new java.util.ArrayList<>())
                    .add(toServiceInventorySelection(link, itemsById.get(link.getInventoryItemId())));
        }
        return grouped;
    }

    private Map<UUID, List<AppointmentServiceInventorySelection>> loadStoredServiceInventorySelectionsByServiceId(
            UUID tenantId,
            UUID appointmentId
    ) {
        List<PetAppointmentServiceLine> lines = appointmentServiceLineRepository
                .findAllByTenantIdAndAppointmentIdOrderByLineOrderAsc(tenantId, appointmentId);
        if (lines.isEmpty()) {
            return Map.of();
        }

        Map<UUID, UUID> lineIdsByServiceId = lines.stream()
                .collect(Collectors.toMap(
                        PetAppointmentServiceLine::getServiceId,
                        PetAppointmentServiceLine::getId,
                        (first, second) -> first,
                        LinkedHashMap::new
                ));

        Map<UUID, List<PetAppointmentServiceLineInventoryResponse>> lineInventoryByLineId = loadLineInventoryByLineId(
                tenantId,
                lineIdsByServiceId.values()
        );

        Map<UUID, List<AppointmentServiceInventorySelection>> grouped = new LinkedHashMap<>();
        lineIdsByServiceId.forEach((serviceId, lineId) -> grouped.put(
                serviceId,
                lineInventoryByLineId.getOrDefault(lineId, List.of()).stream()
                        .map(this::toStoredInventorySelection)
                        .toList()
        ));
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
                loadServiceInventorySelectionsByServiceId(tenantId, serviceIds, Set.of(), Map.of());
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
                    .add(toInventoryResponse(
                            plan.getId(),
                            plan.getInventoryItemId(),
                            plan.getInventoryItemName(),
                            plan.getInventoryItemSku(),
                            plan.getInventoryCategory(),
                            plan.getUnitOfMeasure(),
                            plan.getExpectedQuantity(),
                            plan.getActualQuantity(),
                            plan.getConsumptionStatus(),
                            plan.getConsumptionRule(),
                            true,
                            plan.getAppliedInventoryMovementId() != null,
                            plan.getAppliedInventoryMovementId(),
                            plan.getStockAppliedAt()
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
                null,
                link.getInventoryItemId(),
                item == null ? "Unavailable inventory item" : item.getName(),
                item == null ? "UNAVAILABLE" : item.getSku(),
                item == null || item.getCategory() == null ? "UNKNOWN" : item.getCategory().name(),
                item == null ? "UNIT" : item.getUnitOfMeasure(),
                link.getExpectedQuantity(),
                null,
                PetAppointmentInventoryConsumptionStatus.PLANNED,
                link.getConsumptionRule(),
                false,
                false,
                null,
                null,
                null,
                PetAppointmentInventoryVarianceStatus.PREVIEW_ONLY,
                null,
                null
        );
    }

    private AppointmentServiceInventorySelection toStoredInventorySelection(
            PetAppointmentServiceLineInventoryResponse response
    ) {
        return new AppointmentServiceInventorySelection(
                response.id(),
                response.inventoryItemId(),
                response.inventoryItemName(),
                response.inventoryItemSku(),
                response.inventoryCategory(),
                response.unitOfMeasure(),
                response.expectedQuantity(),
                response.actualQuantity(),
                response.consumptionStatus(),
                response.consumptionRule(),
                response.snapshotBacked(),
                response.stockApplied(),
                response.appliedQuantity(),
                response.plannedActualVarianceQuantity(),
                response.plannedAppliedVarianceQuantity(),
                response.varianceStatus(),
                response.appliedInventoryMovementId(),
                response.stockAppliedAt()
        );
    }

    private PetAppointmentServiceLineInventoryResponse toInventoryPreviewResponse(
            AppointmentServiceInventorySelection selection
    ) {
        return new PetAppointmentServiceLineInventoryResponse(
                selection.id(),
                selection.inventoryItemId(),
                selection.inventoryItemName(),
                selection.inventoryItemSku(),
                selection.inventoryCategory(),
                selection.unitOfMeasure(),
                selection.expectedQuantity(),
                selection.actualQuantity(),
                selection.consumptionStatus(),
                selection.consumptionRule(),
                selection.snapshotBacked(),
                selection.stockApplied(),
                selection.appliedQuantity(),
                selection.plannedActualVarianceQuantity(),
                selection.plannedAppliedVarianceQuantity(),
                selection.varianceStatus(),
                selection.appliedInventoryMovementId(),
                selection.stockAppliedAt()
        );
    }

    private PetAppointmentServiceLineInventoryResponse toInventoryResponse(
            UUID id,
            UUID inventoryItemId,
            String inventoryItemName,
            String inventoryItemSku,
            String inventoryCategory,
            String unitOfMeasure,
            BigDecimal expectedQuantity,
            BigDecimal actualQuantity,
            PetAppointmentInventoryConsumptionStatus consumptionStatus,
            PetServiceInventoryConsumptionRule consumptionRule,
            boolean snapshotBacked,
            boolean stockApplied,
            UUID appliedInventoryMovementId,
            Instant stockAppliedAt
    ) {
        BigDecimal appliedQuantity = stockApplied ? actualQuantity : null;
        BigDecimal plannedActualVarianceQuantity = actualQuantity == null ? null : actualQuantity.subtract(expectedQuantity);
        BigDecimal plannedAppliedVarianceQuantity = appliedQuantity == null ? null : appliedQuantity.subtract(expectedQuantity);
        PetAppointmentInventoryVarianceStatus varianceStatus = resolveInventoryVarianceStatus(
                snapshotBacked,
                stockApplied,
                expectedQuantity,
                actualQuantity,
                consumptionStatus
        );

        return new PetAppointmentServiceLineInventoryResponse(
                id,
                inventoryItemId,
                inventoryItemName,
                inventoryItemSku,
                inventoryCategory,
                unitOfMeasure,
                expectedQuantity,
                actualQuantity,
                consumptionStatus,
                consumptionRule,
                snapshotBacked,
                stockApplied,
                appliedQuantity,
                plannedActualVarianceQuantity,
                plannedAppliedVarianceQuantity,
                varianceStatus,
                appliedInventoryMovementId,
                stockAppliedAt
        );
    }

    private PetAppointmentInventoryVarianceStatus resolveInventoryVarianceStatus(
            boolean snapshotBacked,
            boolean stockApplied,
            BigDecimal expectedQuantity,
            BigDecimal actualQuantity,
            PetAppointmentInventoryConsumptionStatus consumptionStatus
    ) {
        if (!snapshotBacked) {
            return PetAppointmentInventoryVarianceStatus.PREVIEW_ONLY;
        }
        if (stockApplied) {
            BigDecimal appliedReferenceQuantity = actualQuantity == null ? expectedQuantity : actualQuantity;
            return appliedReferenceQuantity.compareTo(expectedQuantity) == 0
                    ? PetAppointmentInventoryVarianceStatus.APPLIED_MATCHED
                    : PetAppointmentInventoryVarianceStatus.APPLIED_DIFFERENT;
        }
        if (actualQuantity != null || consumptionStatus != PetAppointmentInventoryConsumptionStatus.PLANNED) {
            return PetAppointmentInventoryVarianceStatus.ADJUSTED_NOT_APPLIED;
        }
        return PetAppointmentInventoryVarianceStatus.PLANNED_ONLY;
    }

    private boolean hasAppliedInventoryConsumptions(UUID tenantId, List<PetAppointmentServiceLine> existingLines) {
        List<UUID> lineIds = existingLines.stream()
                .map(PetAppointmentServiceLine::getId)
                .filter(Objects::nonNull)
                .toList();
        if (lineIds.isEmpty()) {
            return false;
        }
        return appointmentServiceLineInventoryPlanRepository
                .findAllByTenantIdAndAppointmentServiceIdInOrderByAppointmentServiceIdAscCreatedAtAsc(tenantId, lineIds)
                .stream()
                .anyMatch(plan -> plan.getAppliedInventoryMovementId() != null);
    }

    private int resolveStockApplicationQuantity(PetAppointmentServiceLineInventoryPlan inventoryRow) {
        if (inventoryRow.getConsumptionStatus() != PetAppointmentInventoryConsumptionStatus.READY_TO_APPLY) {
            throw new ConflictOperationException(
                    "Pet appointment inventory rows must be marked ready to apply before stock can be updated."
            );
        }
        if (inventoryRow.getActualQuantity() == null) {
            throw new ConflictOperationException(
                    "Pet appointment inventory rows must record actual usage before stock can be applied."
            );
        }
        if (inventoryRow.getActualQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ConflictOperationException(
                    "Pet appointment stock application requires a positive actual quantity."
            );
        }

        BigDecimal normalizedQuantity = inventoryRow.getActualQuantity().stripTrailingZeros();
        if (normalizedQuantity.scale() > 0) {
            throw new ConflictOperationException(
                    "Pet appointment stock application currently supports only whole stock quantities."
            );
        }
        if (normalizedQuantity.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) > 0) {
            throw new ConflictOperationException("Pet appointment stock application quantity is too large.");
        }
        return normalizedQuantity.intValueExact();
    }

    private String buildStockApplicationReason(
            PetAppointmentServiceLine serviceLine,
            PetAppointmentServiceLineInventoryPlan inventoryRow
    ) {
        return truncateInventoryReason(
                "Pet appointment stock application for service '%s' using %s."
                        .formatted(serviceLine.getServiceName(), inventoryRow.getInventoryItemName())
        );
    }

    private String truncateInventoryReason(String reason) {
        return reason.length() > 255 ? reason.substring(0, 255) : reason;
    }

    private String resolveCurrentOperatorEmail() {
        String email = currentUserService.getRequiredUser().email();
        return email == null || email.isBlank() ? "system" : email.trim();
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
            UUID id,
            UUID inventoryItemId,
            String inventoryItemName,
            String inventoryItemSku,
            String inventoryCategory,
            String unitOfMeasure,
            BigDecimal expectedQuantity,
            BigDecimal actualQuantity,
            PetAppointmentInventoryConsumptionStatus consumptionStatus,
            com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryConsumptionRule consumptionRule,
            boolean snapshotBacked,
            boolean stockApplied,
            BigDecimal appliedQuantity,
            BigDecimal plannedActualVarianceQuantity,
            BigDecimal plannedAppliedVarianceQuantity,
            PetAppointmentInventoryVarianceStatus varianceStatus,
            UUID appliedInventoryMovementId,
            Instant stockAppliedAt
    ) {
    }

    private record NormalizedActualConsumption(
            BigDecimal actualQuantity,
            PetAppointmentInventoryConsumptionStatus consumptionStatus
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

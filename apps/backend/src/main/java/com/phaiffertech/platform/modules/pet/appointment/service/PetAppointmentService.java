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
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
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
    private final PlatformMetricsService platformMetricsService;

    public PetAppointmentService(
            PetAppointmentRepository repository,
            PetClientRepository petClientRepository,
            PetProfileRepository petProfileRepository,
            PetServiceCatalogRepository petServiceCatalogRepository,
            PetProfessionalRepository petProfessionalRepository,
            PlatformMetricsService platformMetricsService
    ) {
        super(repository, repository, PetAppointmentMapper.INSTANCE, "Pet appointment not found.");
        this.repository = repository;
        this.petClientRepository = petClientRepository;
        this.petProfileRepository = petProfileRepository;
        this.petServiceCatalogRepository = petServiceCatalogRepository;
        this.petProfessionalRepository = petProfessionalRepository;
        this.platformMetricsService = platformMetricsService;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetAppointmentCreateRequest request, PetAppointment entity) {
        hydrateAndValidateRelations(tenantId, request.clientId(), request.petId(), request.serviceId(), request.professionalId(), entity);
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetAppointmentUpdateRequest request, PetAppointment entity) {
        hydrateAndValidateRelations(tenantId, request.clientId(), request.petId(), request.serviceId(), request.professionalId(), entity);
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
        Page<PetAppointmentResponse> mapped = appointments.map(appointment ->
                toValidatedResponse(appointment, clientNames, petNames, professionalNames));

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
        PetAppointmentResponse response = doUpdate(id, request);
        return getById(response.id());
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

    private void hydrateAndValidateRelations(
            UUID tenantId,
            UUID clientId,
            UUID petId,
            UUID serviceId,
            UUID professionalId,
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
    }

    private PetAppointmentResponse toValidatedResponse(PetAppointment appointment, UUID tenantId) {
        validateContractIntegrity(appointment);
        return PetAppointmentMapper.INSTANCE.toResponse(
                appointment,
                resolveClientName(petClientRepository.findByIdAndTenantId(appointment.getClientId(), tenantId).orElse(null)),
                resolvePetName(petProfileRepository.findByIdAndTenantId(appointment.getPetId(), tenantId).orElse(null)),
                resolveProfessionalName(petProfessionalRepository.findByIdAndTenantId(appointment.getProfessionalId(), tenantId).orElse(null))
        );
    }

    private PetAppointmentResponse toValidatedResponse(
            PetAppointment appointment,
            Map<UUID, String> clientNames,
            Map<UUID, String> petNames,
            Map<UUID, String> professionalNames
    ) {
        validateContractIntegrity(appointment);
        return PetAppointmentMapper.INSTANCE.toResponse(
                appointment,
                clientNames.get(appointment.getClientId()),
                petNames.get(appointment.getPetId()),
                professionalNames.get(appointment.getProfessionalId())
        );
    }

    private void validateContractIntegrity(PetAppointment appointment) {
        if (appointment.getServiceId() == null || appointment.getProfessionalId() == null) {
            throw new ConflictOperationException(
                    "Pet appointment data is inconsistent with the current contract and requires remediation."
            );
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

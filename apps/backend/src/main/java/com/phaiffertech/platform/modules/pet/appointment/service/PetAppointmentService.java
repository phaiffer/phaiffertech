package com.phaiffertech.platform.modules.pet.appointment.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentCreateRequest;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentResponse;
import com.phaiffertech.platform.modules.pet.appointment.dto.PetAppointmentUpdateRequest;
import com.phaiffertech.platform.modules.pet.appointment.mapper.PetAppointmentMapper;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
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
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.time.Instant;
import java.util.UUID;
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
        return response;
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
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "scheduledAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        BaseSearchSpecificationBuilder.normalizeUpper(status),
                        professionalId,
                        clientId,
                        petId,
                        serviceId,
                        scheduledFrom,
                        scheduledTo,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetAppointmentResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_appointment")
    public PetAppointmentResponse update(UUID id, PetAppointmentUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_appointment")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_appointment")
    public PetAppointmentResponse restore(UUID id) {
        return doRestore(id);
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
}

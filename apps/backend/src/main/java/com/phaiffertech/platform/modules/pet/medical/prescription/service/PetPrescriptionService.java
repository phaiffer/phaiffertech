package com.phaiffertech.platform.modules.pet.medical.prescription.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.medical.prescription.domain.PetPrescription;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionResponse;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.mapper.PetPrescriptionMapper;
import com.phaiffertech.platform.modules.pet.medical.prescription.repository.PetPrescriptionRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
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
public class PetPrescriptionService extends BaseTenantCrudService<
        PetPrescription,
        PetPrescriptionCreateRequest,
        PetPrescriptionUpdateRequest,
        PetPrescriptionResponse> {

    private final PetPrescriptionRepository repository;
    private final PetProfileRepository petProfileRepository;
    private final PetProfessionalRepository petProfessionalRepository;

    public PetPrescriptionService(
            PetPrescriptionRepository repository,
            PetProfileRepository petProfileRepository,
            PetProfessionalRepository petProfessionalRepository
    ) {
        super(repository, repository, PetPrescriptionMapper.INSTANCE, "Pet prescription not found.");
        this.repository = repository;
        this.petProfileRepository = petProfileRepository;
        this.petProfessionalRepository = petProfessionalRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetPrescriptionCreateRequest request, PetPrescription entity) {
        validateReferences(tenantId, request.petId(), request.professionalId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetPrescriptionUpdateRequest request, PetPrescription entity) {
        validateReferences(tenantId, request.petId(), request.professionalId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_prescription")
    public PetPrescriptionResponse create(PetPrescriptionCreateRequest request) {
        PetPrescriptionResponse response = doCreate(request);
        return getById(response.id());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetPrescriptionResponse> list(
            PageRequestDto pageRequest,
            UUID petId,
            UUID professionalId
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PetPrescription> prescriptions = repository.findAllByTenantIdAndSearch(
                tenantId,
                petId,
                professionalId,
                query.search(),
                query.pageable()
        );
        Map<UUID, String> petNames = loadPetNames(tenantId, prescriptions.getContent().stream()
                .map(PetPrescription::getPetId)
                .collect(Collectors.toSet()));
        Map<UUID, String> professionalNames = loadProfessionalNames(tenantId, prescriptions.getContent().stream()
                .map(PetPrescription::getProfessionalId)
                .collect(Collectors.toSet()));
        return PaginationUtils.fromPage(prescriptions.map(prescription -> toResponse(prescription, petNames, professionalNames)));
    }

    @Transactional(readOnly = true)
    public PetPrescriptionResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        return toResponse(getOrThrow(id, tenantId), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_prescription")
    public PetPrescriptionResponse update(UUID id, PetPrescriptionUpdateRequest request) {
        PetPrescriptionResponse response = doUpdate(id, request);
        return getById(response.id());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_prescription")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_prescription")
    public PetPrescriptionResponse restore(UUID id) {
        PetPrescriptionResponse response = doRestore(id);
        return getById(response.id());
    }

    private void validateReferences(UUID tenantId, UUID petId, UUID professionalId) {
        petProfileRepository.findByIdAndTenantId(petId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found for tenant."));
        petProfessionalRepository.findByIdAndTenantId(professionalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet professional not found for tenant."));
    }

    private PetPrescriptionResponse toResponse(PetPrescription prescription, UUID tenantId) {
        return PetPrescriptionMapper.INSTANCE.toResponse(
                prescription,
                petProfileRepository.findByIdAndTenantId(prescription.getPetId(), tenantId).map(PetProfile::getName).orElse(null),
                petProfessionalRepository.findByIdAndTenantId(prescription.getProfessionalId(), tenantId).map(PetProfessional::getName).orElse(null)
        );
    }

    private PetPrescriptionResponse toResponse(
            PetPrescription prescription,
            Map<UUID, String> petNames,
            Map<UUID, String> professionalNames
    ) {
        return PetPrescriptionMapper.INSTANCE.toResponse(
                prescription,
                petNames.get(prescription.getPetId()),
                professionalNames.get(prescription.getProfessionalId())
        );
    }

    private Map<UUID, String> loadPetNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(petProfileRepository.findAllByTenantIdAndIdIn(tenantId, ids), PetProfile::getId, PetProfile::getName);
    }

    private Map<UUID, String> loadProfessionalNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(petProfessionalRepository.findAllByTenantIdAndIdIn(tenantId, ids), PetProfessional::getId, PetProfessional::getName);
    }

    private <E> Map<UUID, String> toMap(
            Collection<E> entities,
            Function<E, UUID> idResolver,
            Function<E, String> valueResolver
    ) {
        return entities.stream().collect(Collectors.toMap(idResolver, valueResolver));
    }
}

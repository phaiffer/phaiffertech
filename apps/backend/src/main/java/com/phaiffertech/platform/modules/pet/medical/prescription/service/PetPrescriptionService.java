package com.phaiffertech.platform.modules.pet.medical.prescription.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.medical.prescription.domain.PetPrescription;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionResponse;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.mapper.PetPrescriptionMapper;
import com.phaiffertech.platform.modules.pet.medical.prescription.repository.PetPrescriptionRepository;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.util.UUID;
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
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetPrescriptionResponse> list(
            PageRequestDto pageRequest,
            UUID petId,
            UUID professionalId
    ) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "createdAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        petId,
                        professionalId,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetPrescriptionResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_prescription")
    public PetPrescriptionResponse update(UUID id, PetPrescriptionUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_prescription")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_prescription")
    public PetPrescriptionResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validateReferences(UUID tenantId, UUID petId, UUID professionalId) {
        petProfileRepository.findByIdAndTenantId(petId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found for tenant."));
        petProfessionalRepository.findByIdAndTenantId(professionalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet professional not found for tenant."));
    }
}

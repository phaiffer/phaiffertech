package com.phaiffertech.platform.modules.pet.medical.record.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.medical.record.domain.PetMedicalRecord;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordResponse;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.record.mapper.PetMedicalRecordMapper;
import com.phaiffertech.platform.modules.pet.medical.record.repository.PetMedicalRecordRepository;
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
public class PetMedicalRecordService extends BaseTenantCrudService<
        PetMedicalRecord,
        PetMedicalRecordCreateRequest,
        PetMedicalRecordUpdateRequest,
        PetMedicalRecordResponse> {

    private final PetMedicalRecordRepository repository;
    private final PetProfileRepository petProfileRepository;
    private final PetProfessionalRepository petProfessionalRepository;

    public PetMedicalRecordService(
            PetMedicalRecordRepository repository,
            PetProfileRepository petProfileRepository,
            PetProfessionalRepository petProfessionalRepository
    ) {
        super(repository, repository, PetMedicalRecordMapper.INSTANCE, "Pet medical record not found.");
        this.repository = repository;
        this.petProfileRepository = petProfileRepository;
        this.petProfessionalRepository = petProfessionalRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetMedicalRecordCreateRequest request, PetMedicalRecord entity) {
        validateReferences(tenantId, request.petId(), request.professionalId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetMedicalRecordUpdateRequest request, PetMedicalRecord entity) {
        validateReferences(tenantId, request.petId(), request.professionalId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_medical_record")
    public PetMedicalRecordResponse create(PetMedicalRecordCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetMedicalRecordResponse> list(
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
    public PetMedicalRecordResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_medical_record")
    public PetMedicalRecordResponse update(UUID id, PetMedicalRecordUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_medical_record")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_medical_record")
    public PetMedicalRecordResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validateReferences(UUID tenantId, UUID petId, UUID professionalId) {
        petProfileRepository.findByIdAndTenantId(petId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found for tenant."));
        petProfessionalRepository.findByIdAndTenantId(professionalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet professional not found for tenant."));
    }
}

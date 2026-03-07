package com.phaiffertech.platform.modules.pet.medical.vaccination.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.medical.vaccination.domain.PetVaccination;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationResponse;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.vaccination.mapper.PetVaccinationMapper;
import com.phaiffertech.platform.modules.pet.medical.vaccination.repository.PetVaccinationRepository;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
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
public class PetVaccinationService extends BaseTenantCrudService<
        PetVaccination,
        PetVaccinationCreateRequest,
        PetVaccinationUpdateRequest,
        PetVaccinationResponse> {

    private final PetVaccinationRepository repository;
    private final PetProfileRepository petProfileRepository;

    public PetVaccinationService(
            PetVaccinationRepository repository,
            PetProfileRepository petProfileRepository
    ) {
        super(repository, repository, PetVaccinationMapper.INSTANCE, "Pet vaccination not found.");
        this.repository = repository;
        this.petProfileRepository = petProfileRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetVaccinationCreateRequest request, PetVaccination entity) {
        validatePet(tenantId, request.petId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetVaccinationUpdateRequest request, PetVaccination entity) {
        validatePet(tenantId, request.petId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_vaccination")
    public PetVaccinationResponse create(PetVaccinationCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetVaccinationResponse> list(PageRequestDto pageRequest, UUID petId) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "appliedAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        petId,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetVaccinationResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_vaccination")
    public PetVaccinationResponse update(UUID id, PetVaccinationUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_vaccination")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_vaccination")
    public PetVaccinationResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validatePet(UUID tenantId, UUID petId) {
        petProfileRepository.findByIdAndTenantId(petId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found for tenant."));
    }
}

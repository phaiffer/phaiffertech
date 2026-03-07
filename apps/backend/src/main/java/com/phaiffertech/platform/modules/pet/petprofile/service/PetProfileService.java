package com.phaiffertech.platform.modules.pet.petprofile.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileCreateRequest;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileResponse;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileUpdateRequest;
import com.phaiffertech.platform.modules.pet.petprofile.mapper.PetProfileMapper;
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
public class PetProfileService extends BaseTenantCrudService<
        PetProfile,
        PetProfileCreateRequest,
        PetProfileUpdateRequest,
        PetProfileResponse> {

    private final PetProfileRepository repository;
    private final PetClientRepository petClientRepository;

    public PetProfileService(
            PetProfileRepository repository,
            PetClientRepository petClientRepository
    ) {
        super(repository, repository, PetProfileMapper.INSTANCE, "Pet profile not found.");
        this.repository = repository;
        this.petClientRepository = petClientRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetProfileCreateRequest request, PetProfile entity) {
        validateClient(tenantId, request.clientId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetProfileUpdateRequest request, PetProfile entity) {
        validateClient(tenantId, request.clientId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_profile")
    public PetProfileResponse create(PetProfileCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetProfileResponse> list(PageRequestDto pageRequest, UUID clientId) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "createdAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        clientId,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetProfileResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_profile")
    public PetProfileResponse update(UUID id, PetProfileUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_profile")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_profile")
    public PetProfileResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validateClient(UUID tenantId, UUID clientId) {
        petClientRepository.findByIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet client not found for tenant."));
    }
}

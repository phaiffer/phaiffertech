package com.phaiffertech.platform.modules.pet.client.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientCreateRequest;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientResponse;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientUpdateRequest;
import com.phaiffertech.platform.modules.pet.client.mapper.PetClientMapper;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseSearchSpecificationBuilder;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetClientService extends BaseTenantCrudService<
        PetClient,
        PetClientCreateRequest,
        PetClientUpdateRequest,
        PetClientResponse> {

    private final PetClientRepository repository;

    public PetClientService(PetClientRepository repository) {
        super(repository, repository, PetClientMapper.INSTANCE, "Pet client not found.");
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_client")
    public PetClientResponse create(PetClientCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetClientResponse> list(PageRequestDto pageRequest, String status) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "createdAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        BaseSearchSpecificationBuilder.normalizeUpper(status),
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetClientResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_client")
    public PetClientResponse update(UUID id, PetClientUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_client")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_client")
    public PetClientResponse restore(UUID id) {
        return doRestore(id);
    }
}

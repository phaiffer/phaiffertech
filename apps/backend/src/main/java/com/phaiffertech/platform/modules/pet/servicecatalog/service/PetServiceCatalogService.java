package com.phaiffertech.platform.modules.pet.servicecatalog.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogCreateRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogResponse;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogUpdateRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.mapper.PetServiceCatalogMapper;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PetServiceCatalogService extends BaseTenantCrudService<
        PetServiceCatalog,
        PetServiceCatalogCreateRequest,
        PetServiceCatalogUpdateRequest,
        PetServiceCatalogResponse> {

    private final PetServiceCatalogRepository repository;

    public PetServiceCatalogService(PetServiceCatalogRepository repository) {
        super(repository, repository, PetServiceCatalogMapper.INSTANCE, "Pet service not found.");
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_service")
    public PetServiceCatalogResponse create(PetServiceCatalogCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetServiceCatalogResponse> list(PageRequestDto pageRequest) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.ASC, "name"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetServiceCatalogResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_service")
    public PetServiceCatalogResponse update(UUID id, PetServiceCatalogUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_service")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_service")
    public PetServiceCatalogResponse restore(UUID id) {
        return doRestore(id);
    }
}

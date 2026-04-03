package com.phaiffertech.platform.modules.pet.servicecatalog.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCategory;
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
    private final PetServiceCatalogCategoryPolicyService categoryPolicyService;

    public PetServiceCatalogService(
            PetServiceCatalogRepository repository,
            PetServiceCatalogCategoryPolicyService categoryPolicyService
    ) {
        super(repository, repository, PetServiceCatalogMapper.INSTANCE, "Pet service not found.");
        this.repository = repository;
        this.categoryPolicyService = categoryPolicyService;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetServiceCatalogCreateRequest request, PetServiceCatalog entity) {
        categoryPolicyService.validateCategoryAccess(tenantId, entity.getCategory());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetServiceCatalogUpdateRequest request, PetServiceCatalog entity) {
        categoryPolicyService.validateCategoryAccess(tenantId, entity.getCategory());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_service")
    public PetServiceCatalogResponse create(PetServiceCatalogCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetServiceCatalogResponse> list(
            PageRequestDto pageRequest,
            PetServiceCategory category,
            Boolean active
    ) {
        UUID tenantId = currentTenantId();
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.ASC, "name"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndFilters(
                        tenantId,
                        categoryPolicyService.resolveAllowedCategories(tenantId),
                        category,
                        active,
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetServiceCatalogResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        PetServiceCatalog entity = getOrThrow(id, tenantId);
        categoryPolicyService.validateCategoryAccess(tenantId, entity.getCategory());
        return PetServiceCatalogMapper.INSTANCE.toResponse(entity);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_service")
    public PetServiceCatalogResponse update(UUID id, PetServiceCatalogUpdateRequest request) {
        UUID tenantId = currentTenantId();
        categoryPolicyService.validateCategoryAccess(tenantId, getOrThrow(id, tenantId).getCategory());
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_service")
    public void delete(UUID id) {
        UUID tenantId = currentTenantId();
        categoryPolicyService.validateCategoryAccess(tenantId, getOrThrow(id, tenantId).getCategory());
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_service")
    public PetServiceCatalogResponse restore(UUID id) {
        UUID tenantId = currentTenantId();
        categoryPolicyService.validateCategoryAccess(tenantId, getIncludingDeletedOrThrow(id, tenantId).getCategory());
        return doRestore(id);
    }
}

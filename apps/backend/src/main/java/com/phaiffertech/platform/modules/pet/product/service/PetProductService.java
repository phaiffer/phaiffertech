package com.phaiffertech.platform.modules.pet.product.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.product.domain.PetProduct;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductCreateRequest;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductResponse;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductUpdateRequest;
import com.phaiffertech.platform.modules.pet.product.mapper.PetProductMapper;
import com.phaiffertech.platform.modules.pet.product.repository.PetProductRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetProductService extends BaseTenantCrudService<
        PetProduct,
        PetProductCreateRequest,
        PetProductUpdateRequest,
        PetProductResponse> {

    private final PetProductRepository repository;

    public PetProductService(PetProductRepository repository) {
        super(repository, repository, PetProductMapper.INSTANCE, "Pet product not found.");
        this.repository = repository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetProductCreateRequest request, PetProduct entity) {
        validateSkuUniqueness(tenantId, entity.getSku(), null);
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetProductUpdateRequest request, PetProduct entity) {
        validateSkuUniqueness(tenantId, entity.getSku(), entity.getId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_product")
    public PetProductResponse create(PetProductCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetProductResponse> list(PageRequestDto pageRequest) {
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
    public PetProductResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_product")
    public PetProductResponse update(UUID id, PetProductUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_product")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_product")
    public PetProductResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validateSkuUniqueness(UUID tenantId, String sku, UUID currentId) {
        boolean exists = currentId == null
                ? repository.existsBySkuAndTenantId(sku, tenantId)
                : repository.existsBySkuAndTenantIdAndIdNot(sku, tenantId, currentId);
        if (exists) {
            throw new IllegalArgumentException("Product SKU already exists for tenant.");
        }
    }
}

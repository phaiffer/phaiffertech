package com.phaiffertech.platform.modules.pet.product.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.core.inventory.domain.InventoryItemCategory;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementSource;
import com.phaiffertech.platform.core.inventory.service.InventoryItemService;
import com.phaiffertech.platform.core.inventory.service.InventoryItemUpsertCommand;
import com.phaiffertech.platform.modules.pet.product.domain.PetProduct;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductCreateRequest;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductResponse;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductUpdateRequest;
import com.phaiffertech.platform.modules.pet.product.repository.PetProductRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetProductService {

    private final PetProductRepository repository;
    private final InventoryItemService inventoryItemService;

    public PetProductService(
            PetProductRepository repository,
            InventoryItemService inventoryItemService
    ) {
        this.repository = repository;
        this.inventoryItemService = inventoryItemService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_product")
    public PetProductResponse create(PetProductCreateRequest request) {
        UUID tenantId = currentTenantId();
        InventoryItem item = inventoryItemService.createCatalogItem(
                tenantId,
                toInventoryCommand(request),
                InventoryMovementSource.PET_PRODUCT_SYNC,
                null,
                "Initial balance registered from pet product catalog."
        );

        PetProduct entity = new PetProduct();
        entity.setTenantId(tenantId);
        entity.setName(request.name().trim());
        entity.setSku(item.getSku());
        entity.setPrice(request.price());
        entity.setInventoryItemId(item.getId());

        return toResponse(repository.save(entity), item);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetProductResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.ASC, "name"));
        Page<PetProduct> products = repository.findAllByTenantIdAndSearch(
                tenantId,
                query.search(),
                query.pageable()
        );

        Map<UUID, InventoryItem> itemsById = inventoryItemService.getAllByIds(
                tenantId,
                products.getContent().stream()
                        .map(PetProduct::getInventoryItemId)
                        .collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(InventoryItem::getId, Function.identity()));

        return PaginationUtils.fromPage(products.map(product -> toResponse(product, requireInventoryItem(product, itemsById))));
    }

    @Transactional(readOnly = true)
    public PetProductResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        PetProduct product = getOrThrow(id, tenantId);
        return toResponse(product, inventoryItemService.getOrThrow(product.getInventoryItemId(), tenantId));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_product")
    public PetProductResponse update(UUID id, PetProductUpdateRequest request) {
        UUID tenantId = currentTenantId();
        PetProduct product = getOrThrow(id, tenantId);
        InventoryItem item = inventoryItemService.updateCatalogItem(
                tenantId,
                product.getInventoryItemId(),
                toInventoryCommand(request),
                InventoryMovementSource.PET_PRODUCT_SYNC,
                product.getId(),
                "Inventory balance synchronized from pet product catalog."
        );

        product.setName(request.name().trim());
        product.setSku(item.getSku());
        product.setPrice(request.price());

        return toResponse(repository.save(product), item);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_product")
    public void delete(UUID id) {
        UUID tenantId = currentTenantId();
        PetProduct product = getOrThrow(id, tenantId);

        inventoryItemService.softDelete(tenantId, product.getInventoryItemId());
        product.setDeletedAt(Instant.now());
        repository.save(product);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_product")
    public PetProductResponse restore(UUID id) {
        UUID tenantId = currentTenantId();
        PetProduct product = repository.findByIdIncludingDeleted(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet product not found."));

        product.setDeletedAt(null);
        InventoryItem item = inventoryItemService.restore(tenantId, product.getInventoryItemId());
        return toResponse(repository.save(product), item);
    }

    private PetProduct getOrThrow(UUID productId, UUID tenantId) {
        return repository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet product not found."));
    }

    private InventoryItemUpsertCommand toInventoryCommand(PetProductCreateRequest request) {
        return new InventoryItemUpsertCommand(
                request.name(),
                request.sku(),
                resolvePetCategory(request.category()),
                request.unitOfMeasure(),
                request.stockQuantity(),
                request.minimumQuantity(),
                request.reorderPoint()
        );
    }

    private InventoryItemUpsertCommand toInventoryCommand(PetProductUpdateRequest request) {
        return new InventoryItemUpsertCommand(
                request.name(),
                request.sku(),
                resolvePetCategory(request.category()),
                request.unitOfMeasure(),
                request.stockQuantity(),
                request.minimumQuantity(),
                request.reorderPoint()
        );
    }

    private InventoryItemCategory resolvePetCategory(String category) {
        if (category == null || category.isBlank()) {
            return InventoryItemCategory.PET_RETAIL_GOOD;
        }
        InventoryItemCategory resolved;
        try {
            resolved = InventoryItemCategory.valueOf(category.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid category. Valid pet values are: PET_RETAIL_GOOD, PET_VETERINARY_SUPPLY");
        }
        if (!resolved.isPetCategory()) {
            throw new IllegalArgumentException("Invalid category. Valid pet values are: PET_RETAIL_GOOD, PET_VETERINARY_SUPPLY");
        }
        return resolved;
    }

    private InventoryItem requireInventoryItem(PetProduct product, Map<UUID, InventoryItem> itemsById) {
        InventoryItem item = itemsById.get(product.getInventoryItemId());
        if (item == null) {
            throw new ResourceNotFoundException("Inventory item not found for pet product.");
        }
        return item;
    }

    private PetProductResponse toResponse(PetProduct product, InventoryItem item) {
        return new PetProductResponse(
                product.getId(),
                product.getInventoryItemId(),
                product.getName(),
                product.getSku(),
                product.getPrice(),
                item.getCategory().name(),
                item.getUnitOfMeasure(),
                item.getCurrentQuantity(),
                item.getCurrentQuantity(),
                item.getMinimumQuantity(),
                item.getReorderPoint(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    private UUID currentTenantId() {
        return TenantContext.getRequiredTenantId();
    }
}

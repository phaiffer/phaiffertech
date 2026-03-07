package com.phaiffertech.platform.modules.pet.inventory.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.inventory.domain.PetInventoryMovement;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementCreateRequest;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementResponse;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementUpdateRequest;
import com.phaiffertech.platform.modules.pet.inventory.mapper.PetInventoryMovementMapper;
import com.phaiffertech.platform.modules.pet.inventory.repository.PetInventoryMovementRepository;
import com.phaiffertech.platform.modules.pet.product.domain.PetProduct;
import com.phaiffertech.platform.modules.pet.product.repository.PetProductRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetInventoryMovementService {

    private static final String TYPE_IN = "IN";
    private static final String TYPE_OUT = "OUT";

    private final PetInventoryMovementRepository repository;
    private final PetProductRepository productRepository;

    public PetInventoryMovementService(
            PetInventoryMovementRepository repository,
            PetProductRepository productRepository
    ) {
        this.repository = repository;
        this.productRepository = productRepository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_inventory_movement")
    public PetInventoryMovementResponse create(PetInventoryMovementCreateRequest request) {
        UUID tenantId = currentTenantId();
        PetProduct product = getProductOrThrow(request.productId(), tenantId);

        PetInventoryMovement entity = PetInventoryMovementMapper.INSTANCE.toNewEntity(request);
        entity.setTenantId(tenantId);
        adjustStock(product, entity.getMovementType(), entity.getQuantity(), false);

        productRepository.save(product);
        return PetInventoryMovementMapper.INSTANCE.toResponse(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetInventoryMovementResponse> list(
            PageRequestDto pageRequest,
            UUID productId,
            String movementType
    ) {
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PetInventoryMovementResponse> mapped = repository.findAllByTenantIdAndSearch(
                currentTenantId(),
                productId,
                normalizeType(movementType),
                query.search(),
                query.pageable()
        ).map(PetInventoryMovementMapper.INSTANCE::toResponse);

        return PaginationUtils.fromPage(mapped);
    }

    @Transactional(readOnly = true)
    public PetInventoryMovementResponse getById(UUID id) {
        return PetInventoryMovementMapper.INSTANCE.toResponse(getOrThrow(id, currentTenantId()));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_inventory_movement")
    public PetInventoryMovementResponse update(UUID id, PetInventoryMovementUpdateRequest request) {
        UUID tenantId = currentTenantId();
        PetInventoryMovement entity = getOrThrow(id, tenantId);

        PetProduct oldProduct = getProductOrThrow(entity.getProductId(), tenantId);
        adjustStock(oldProduct, entity.getMovementType(), entity.getQuantity(), true);

        PetInventoryMovementMapper.INSTANCE.updateEntity(entity, request);
        PetProduct newProduct = getProductOrThrow(entity.getProductId(), tenantId);
        adjustStock(newProduct, entity.getMovementType(), entity.getQuantity(), false);

        productRepository.save(oldProduct);
        if (!oldProduct.getId().equals(newProduct.getId())) {
            productRepository.save(newProduct);
        } else {
            productRepository.save(newProduct);
        }

        return PetInventoryMovementMapper.INSTANCE.toResponse(repository.save(entity));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_inventory_movement")
    public void delete(UUID id) {
        UUID tenantId = currentTenantId();
        PetInventoryMovement entity = getOrThrow(id, tenantId);
        PetProduct product = getProductOrThrow(entity.getProductId(), tenantId);

        adjustStock(product, entity.getMovementType(), entity.getQuantity(), true);
        entity.setDeletedAt(Instant.now());

        productRepository.save(product);
        repository.save(entity);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_inventory_movement")
    public PetInventoryMovementResponse restore(UUID id) {
        UUID tenantId = currentTenantId();
        PetInventoryMovement entity = repository.findByIdIncludingDeleted(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet inventory movement not found."));
        PetProduct product = getProductOrThrow(entity.getProductId(), tenantId);

        adjustStock(product, entity.getMovementType(), entity.getQuantity(), false);
        entity.setDeletedAt(null);

        productRepository.save(product);
        return PetInventoryMovementMapper.INSTANCE.toResponse(repository.save(entity));
    }

    private PetInventoryMovement getOrThrow(UUID id, UUID tenantId) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet inventory movement not found."));
    }

    private PetProduct getProductOrThrow(UUID productId, UUID tenantId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet product not found for tenant."));
    }

    private void adjustStock(PetProduct product, String movementType, Integer quantity, boolean revert) {
        String normalizedType = normalizeType(movementType);
        if (!TYPE_IN.equals(normalizedType) && !TYPE_OUT.equals(normalizedType)) {
            throw new IllegalArgumentException("Inventory movement type must be IN or OUT.");
        }

        int signedQuantity = TYPE_IN.equals(normalizedType) ? quantity : -quantity;
        int nextStock = product.getStockQuantity() + (revert ? -signedQuantity : signedQuantity);
        if (nextStock < 0) {
            throw new IllegalArgumentException("Inventory movement would result in negative stock.");
        }
        product.setStockQuantity(nextStock);
    }

    private String normalizeType(String movementType) {
        if (movementType == null || movementType.isBlank()) {
            return null;
        }
        return movementType.trim().toUpperCase();
    }

    private UUID currentTenantId() {
        return TenantContext.getRequiredTenantId();
    }
}

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
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
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
        PetInventoryMovement saved = repository.save(entity);
        return PetInventoryMovementMapper.INSTANCE.toResponse(saved, product.getName(), product.getSku());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetInventoryMovementResponse> list(
            PageRequestDto pageRequest,
            UUID productId,
            String movementType
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PetInventoryMovement> movements = repository.findAllByTenantIdAndSearch(
                tenantId,
                productId,
                normalizeType(movementType),
                query.search(),
                query.pageable()
        );
        Map<UUID, PetProduct> productsById = loadProducts(tenantId, movements.getContent().stream()
                .map(PetInventoryMovement::getProductId)
                .collect(Collectors.toSet()));
        Page<PetInventoryMovementResponse> mapped = movements.map(movement -> toResponse(movement, productsById));

        return PaginationUtils.fromPage(mapped);
    }

    @Transactional(readOnly = true)
    public PetInventoryMovementResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        PetInventoryMovement movement = getOrThrow(id, tenantId);
        return toResponse(movement, getProductOrThrow(movement.getProductId(), tenantId));
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

        PetInventoryMovement saved = repository.save(entity);
        return PetInventoryMovementMapper.INSTANCE.toResponse(saved, newProduct.getName(), newProduct.getSku());
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

        if (entity.getDeletedAt() == null) {
            throw new ConflictOperationException("Pet inventory movement is already active.");
        }

        PetProduct product = getProductOrThrow(entity.getProductId(), tenantId);

        adjustStock(product, entity.getMovementType(), entity.getQuantity(), false);
        entity.setDeletedAt(null);

        productRepository.save(product);
        PetInventoryMovement saved = repository.save(entity);
        return PetInventoryMovementMapper.INSTANCE.toResponse(saved, product.getName(), product.getSku());
    }

    private PetInventoryMovement getOrThrow(UUID id, UUID tenantId) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet inventory movement not found."));
    }

    private PetProduct getProductOrThrow(UUID productId, UUID tenantId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet product not found for tenant."));
    }

    private PetInventoryMovementResponse toResponse(PetInventoryMovement movement, PetProduct product) {
        return PetInventoryMovementMapper.INSTANCE.toResponse(movement, product.getName(), product.getSku());
    }

    private PetInventoryMovementResponse toResponse(PetInventoryMovement movement, Map<UUID, PetProduct> productsById) {
        PetProduct product = productsById.get(movement.getProductId());
        return PetInventoryMovementMapper.INSTANCE.toResponse(
                movement,
                product == null ? null : product.getName(),
                product == null ? null : product.getSku()
        );
    }

    private Map<UUID, PetProduct> loadProducts(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(productRepository.findAllByTenantIdAndIdIn(tenantId, ids), PetProduct::getId, Function.identity());
    }

    private <E, V> Map<UUID, V> toMap(
            Collection<E> entities,
            Function<E, UUID> idResolver,
            Function<E, V> valueResolver
    ) {
        return entities.stream().collect(Collectors.toMap(idResolver, valueResolver));
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

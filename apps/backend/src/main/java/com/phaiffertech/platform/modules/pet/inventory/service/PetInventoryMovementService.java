package com.phaiffertech.platform.modules.pet.inventory.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.core.inventory.domain.InventoryItemCategory;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovement;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementSource;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementType;
import com.phaiffertech.platform.core.inventory.repository.InventoryMovementRepository;
import com.phaiffertech.platform.core.inventory.service.InventoryItemService;
import com.phaiffertech.platform.core.inventory.service.InventoryMovementCommand;
import com.phaiffertech.platform.core.inventory.service.InventoryMovementService;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementCreateRequest;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementResponse;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementUpdateRequest;
import com.phaiffertech.platform.modules.pet.product.domain.PetProduct;
import com.phaiffertech.platform.modules.pet.product.repository.PetProductRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetInventoryMovementService {

    private final InventoryMovementRepository movementRepository;
    private final InventoryMovementService movementService;
    private final InventoryItemService inventoryItemService;
    private final PetProductRepository productRepository;

    public PetInventoryMovementService(
            InventoryMovementRepository movementRepository,
            InventoryMovementService movementService,
            InventoryItemService inventoryItemService,
            PetProductRepository productRepository
    ) {
        this.movementRepository = movementRepository;
        this.movementService = movementService;
        this.inventoryItemService = inventoryItemService;
        this.productRepository = productRepository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_inventory_movement")
    public PetInventoryMovementResponse create(PetInventoryMovementCreateRequest request) {
        UUID tenantId = currentTenantId();
        PetProduct product = getProductOrThrow(request.productId(), tenantId);
        InventoryMovement movement = movementService.createMovement(
                tenantId,
                toMovementCommand(request, product, tenantId)
        );
        return toResponse(movement, product);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetInventoryMovementResponse> list(
            PageRequestDto pageRequest,
            UUID productId,
            String movementType
    ) {
        UUID tenantId = currentTenantId();
        UUID inventoryItemId = productId == null ? null : getProductOrThrow(productId, tenantId).getInventoryItemId();
        BasePageQuery query = new BasePageQuery(
                PaginationUtils.toPageableWithoutSort(pageRequest),
                pageRequest == null ? "%" : pageRequest.normalizedSearchPattern()
        );
        InventoryMovementType normalizedMovementType = normalizeType(movementType);
        Page<InventoryMovement> movements = findMovements(
                tenantId,
                inventoryItemId,
                normalizedMovementType,
                query
        );

        Map<UUID, PetProduct> productsByInventoryItemId = loadProductsByInventoryItemId(
                tenantId,
                movements.getContent().stream()
                        .map(InventoryMovement::getInventoryItemId)
                        .collect(Collectors.toSet())
        );

        return PaginationUtils.fromPage(movements.map(movement -> toResponse(
                movement,
                productsByInventoryItemId.get(movement.getInventoryItemId())
        )));
    }

    @Transactional(readOnly = true)
    public PetInventoryMovementResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        InventoryMovement movement = getMovementOrThrow(id, tenantId);
        return toResponse(movement, getProductByInventoryItemOrThrow(movement.getInventoryItemId(), tenantId));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_inventory_movement")
    public PetInventoryMovementResponse update(UUID id, PetInventoryMovementUpdateRequest request) {
        UUID tenantId = currentTenantId();
        PetProduct product = getProductOrThrow(request.productId(), tenantId);
        InventoryMovement movement = movementService.updateMovement(
                tenantId,
                id,
                toMovementCommand(request, product, tenantId)
        );
        return toResponse(movement, product);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_inventory_movement")
    public void delete(UUID id) {
        movementService.deleteMovement(currentTenantId(), id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_inventory_movement")
    public PetInventoryMovementResponse restore(UUID id) {
        UUID tenantId = currentTenantId();
        InventoryMovement movement = movementService.restoreMovement(tenantId, id);
        return toResponse(movement, getProductByInventoryItemOrThrow(movement.getInventoryItemId(), tenantId));
    }

    private InventoryMovementCommand toMovementCommand(
            PetInventoryMovementCreateRequest request,
            PetProduct product,
            UUID tenantId
    ) {
        InventoryItem item = inventoryItemService.getOrThrow(product.getInventoryItemId(), tenantId);
        InventoryMovementType movementType = normalizeType(request.movementType());
        InventoryMovementSource sourceType = resolveSource(item.getCategory(), movementType);
        return new InventoryMovementCommand(
                item.getId(),
                movementType,
                request.quantity(),
                sourceType,
                product.getId(),
                resolveReason(sourceType, request.notes())
        );
    }

    private InventoryMovementCommand toMovementCommand(
            PetInventoryMovementUpdateRequest request,
            PetProduct product,
            UUID tenantId
    ) {
        InventoryItem item = inventoryItemService.getOrThrow(product.getInventoryItemId(), tenantId);
        InventoryMovementType movementType = normalizeType(request.movementType());
        InventoryMovementSource sourceType = resolveSource(item.getCategory(), movementType);
        return new InventoryMovementCommand(
                item.getId(),
                movementType,
                request.quantity(),
                sourceType,
                product.getId(),
                resolveReason(sourceType, request.notes())
        );
    }

    private InventoryMovementType normalizeType(String movementType) {
        if (movementType == null || movementType.isBlank()) {
            return null;
        }
        return InventoryMovementType.valueOf(movementType.trim().toUpperCase());
    }

    private Page<InventoryMovement> findMovements(
            UUID tenantId,
            UUID inventoryItemId,
            InventoryMovementType movementType,
            BasePageQuery query
    ) {
        if (inventoryItemId != null && movementType != null) {
            return movementRepository.findAllByTenantIdAndInventoryItemIdAndMovementTypeAndSearch(
                    tenantId,
                    inventoryItemId,
                    movementType.name(),
                    query.search(),
                    query.pageable()
            );
        }
        if (inventoryItemId != null) {
            return movementRepository.findAllByTenantIdAndInventoryItemIdAndSearch(
                    tenantId,
                    inventoryItemId,
                    query.search(),
                    query.pageable()
            );
        }
        if (movementType != null) {
            return movementRepository.findAllByTenantIdAndMovementTypeAndSearch(
                    tenantId,
                    movementType.name(),
                    query.search(),
                    query.pageable()
            );
        }
        return movementRepository.findAllByTenantIdAndSearch(
                tenantId,
                query.search(),
                query.pageable()
        );
    }

    private InventoryMovementSource resolveSource(InventoryItemCategory category, InventoryMovementType movementType) {
        if (InventoryMovementType.IN.equals(movementType)) {
            return InventoryMovementSource.MANUAL;
        }
        if (InventoryItemCategory.PET_VETERINARY_SUPPLY.equals(category)) {
            return InventoryMovementSource.PET_CLINIC_CONSUMPTION;
        }
        return InventoryMovementSource.PET_RETAIL_SALE;
    }

    private String resolveReason(InventoryMovementSource sourceType, String notes) {
        if (notes != null && !notes.isBlank()) {
            return notes.trim();
        }
        return switch (sourceType) {
            case PET_CLINIC_CONSUMPTION -> "Veterinary supply consumption.";
            case PET_RETAIL_SALE -> "Retail stock consumption.";
            default -> "Manual stock replenishment.";
        };
    }

    private InventoryMovement getMovementOrThrow(UUID movementId, UUID tenantId) {
        return movementRepository.findByIdAndTenantId(movementId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet inventory movement not found."));
    }

    private PetProduct getProductOrThrow(UUID productId, UUID tenantId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet product not found for tenant."));
    }

    private PetProduct getProductByInventoryItemOrThrow(UUID inventoryItemId, UUID tenantId) {
        return productRepository.findByInventoryItemIdAndTenantId(inventoryItemId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet product not found for inventory item."));
    }

    private Map<UUID, PetProduct> loadProductsByInventoryItemId(UUID tenantId, Collection<UUID> inventoryItemIds) {
        if (inventoryItemIds.isEmpty()) {
            return Map.of();
        }
        return productRepository.findAllByTenantIdAndInventoryItemIdIn(tenantId, inventoryItemIds).stream()
                .collect(Collectors.toMap(PetProduct::getInventoryItemId, Function.identity()));
    }

    private PetInventoryMovementResponse toResponse(InventoryMovement movement, PetProduct product) {
        return new PetInventoryMovementResponse(
                movement.getId(),
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                product == null ? null : product.getSku(),
                movement.getMovementType().name(),
                movement.getQuantity(),
                movement.getSourceType().name(),
                movement.getReason(),
                movement.getReason(),
                movement.getQuantityBefore(),
                movement.getQuantityAfter(),
                movement.getCreatedAt(),
                movement.getUpdatedAt()
        );
    }

    private UUID currentTenantId() {
        return TenantContext.getRequiredTenantId();
    }
}

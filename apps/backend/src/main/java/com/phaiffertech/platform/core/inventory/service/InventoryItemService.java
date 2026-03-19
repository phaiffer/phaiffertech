package com.phaiffertech.platform.core.inventory.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementSource;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementType;
import com.phaiffertech.platform.core.inventory.repository.InventoryItemRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryItemService {

    private static final String DEFAULT_UNIT_OF_MEASURE = "UNIT";

    private final InventoryItemRepository itemRepository;
    private final InventoryMovementService movementService;

    public InventoryItemService(
            InventoryItemRepository itemRepository,
            InventoryMovementService movementService
    ) {
        this.itemRepository = itemRepository;
        this.movementService = movementService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "inventory_item")
    public InventoryItem createCatalogItem(
            UUID tenantId,
            InventoryItemUpsertCommand command,
            InventoryMovementSource initialSource,
            UUID initialSourceReferenceId,
            String initialReason
    ) {
        InventoryItem normalized = toNewItem(tenantId, command);
        validateSkuUniqueness(tenantId, normalized.getSku(), null);

        int openingQuantity = normalized.getCurrentQuantity();
        normalized.setCurrentQuantity(0);
        InventoryItem saved = itemRepository.save(normalized);

        if (openingQuantity > 0) {
            movementService.createMovement(
                    tenantId,
                    new InventoryMovementCommand(
                            saved.getId(),
                            InventoryMovementType.IN,
                            openingQuantity,
                            initialSource,
                            initialSourceReferenceId,
                            normalizeReason(initialReason, "Initial inventory registration.")
                    )
            );
        }

        return getOrThrow(saved.getId(), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "inventory_item")
    public InventoryItem updateCatalogItem(
            UUID tenantId,
            UUID inventoryItemId,
            InventoryItemUpsertCommand command,
            InventoryMovementSource adjustmentSource,
            UUID adjustmentSourceReferenceId,
            String adjustmentReason
    ) {
        InventoryItem item = getLockedOrThrow(inventoryItemId, tenantId);
        validateSkuUniqueness(tenantId, normalizeSku(command.sku()), inventoryItemId);
        validateQuantities(command.minimumQuantity(), command.reorderPoint(), command.currentQuantity());

        int previousQuantity = item.getCurrentQuantity();

        item.setName(command.name().trim());
        item.setSku(normalizeSku(command.sku()));
        item.setCategory(command.category());
        item.setUnitOfMeasure(normalizeUnit(command.unitOfMeasure()));
        item.setMinimumQuantity(normalizeQuantity(command.minimumQuantity()));
        item.setReorderPoint(normalizeQuantity(command.reorderPoint()));

        itemRepository.save(item);

        int requestedQuantity = normalizeQuantity(command.currentQuantity());
        int delta = requestedQuantity - previousQuantity;
        if (delta != 0) {
            movementService.createMovement(
                    tenantId,
                    new InventoryMovementCommand(
                            item.getId(),
                            delta > 0 ? InventoryMovementType.IN : InventoryMovementType.OUT,
                            Math.abs(delta),
                            adjustmentSource,
                            adjustmentSourceReferenceId,
                            normalizeReason(adjustmentReason, "Inventory balance adjusted.")
                    )
            );
        }

        return getOrThrow(item.getId(), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "inventory_item")
    public void softDelete(UUID tenantId, UUID inventoryItemId) {
        InventoryItem item = getOrThrow(inventoryItemId, tenantId);
        item.setDeletedAt(Instant.now());
        itemRepository.save(item);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "inventory_item")
    public InventoryItem restore(UUID tenantId, UUID inventoryItemId) {
        InventoryItem item = itemRepository.findByIdIncludingDeleted(inventoryItemId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found."));
        if (item.getDeletedAt() == null) {
            throw new ConflictOperationException("Inventory item is already active.");
        }
        item.setDeletedAt(null);
        return itemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public InventoryItem getOrThrow(UUID inventoryItemId, UUID tenantId) {
        return itemRepository.findByIdAndTenantId(inventoryItemId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found."));
    }

    @Transactional(readOnly = true)
    public List<InventoryItem> getAllByIds(UUID tenantId, Collection<UUID> inventoryItemIds) {
        if (inventoryItemIds == null || inventoryItemIds.isEmpty()) {
            return Collections.emptyList();
        }
        return itemRepository.findAllByTenantIdAndIdIn(tenantId, inventoryItemIds);
    }

    @Transactional(readOnly = true)
    public InventoryItem getIncludingDeletedOrThrow(UUID inventoryItemId, UUID tenantId) {
        return itemRepository.findByIdIncludingDeleted(inventoryItemId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found."));
    }

    private InventoryItem getLockedOrThrow(UUID inventoryItemId, UUID tenantId) {
        return itemRepository.findLockedByIdAndTenantId(inventoryItemId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found."));
    }

    private InventoryItem toNewItem(UUID tenantId, InventoryItemUpsertCommand command) {
        validateCommand(command);
        validateQuantities(command.minimumQuantity(), command.reorderPoint(), command.currentQuantity());

        InventoryItem item = new InventoryItem();
        item.setTenantId(tenantId);
        item.setName(command.name().trim());
        item.setSku(normalizeSku(command.sku()));
        item.setCategory(command.category());
        item.setUnitOfMeasure(normalizeUnit(command.unitOfMeasure()));
        item.setCurrentQuantity(normalizeQuantity(command.currentQuantity()));
        item.setMinimumQuantity(normalizeQuantity(command.minimumQuantity()));
        item.setReorderPoint(normalizeQuantity(command.reorderPoint()));
        return item;
    }

    private void validateCommand(InventoryItemUpsertCommand command) {
        if (command.name() == null || command.name().isBlank()) {
            throw new IllegalArgumentException("Inventory item name is required.");
        }
        if (command.sku() == null || command.sku().isBlank()) {
            throw new IllegalArgumentException("Inventory item SKU is required.");
        }
        if (command.category() == null) {
            throw new IllegalArgumentException("Inventory item category is required.");
        }
    }

    private void validateQuantities(Integer minimumQuantity, Integer reorderPoint, Integer currentQuantity) {
        int normalizedMinimum = normalizeQuantity(minimumQuantity);
        int normalizedReorderPoint = normalizeQuantity(reorderPoint);
        int normalizedCurrentQuantity = normalizeQuantity(currentQuantity);

        if (normalizedCurrentQuantity < 0) {
            throw new IllegalArgumentException("Inventory current quantity cannot be negative.");
        }
        if (normalizedReorderPoint < normalizedMinimum) {
            throw new IllegalArgumentException("Inventory reorder point cannot be lower than minimum quantity.");
        }
    }

    private void validateSkuUniqueness(UUID tenantId, String sku, UUID currentId) {
        boolean exists = currentId == null
                ? itemRepository.existsBySkuAndTenantId(sku, tenantId)
                : itemRepository.existsBySkuAndTenantIdAndIdNot(sku, tenantId, currentId);
        if (exists) {
            throw new IllegalArgumentException("Inventory SKU already exists for tenant.");
        }
    }

    private String normalizeSku(String sku) {
        return sku.trim().toUpperCase();
    }

    private String normalizeUnit(String unitOfMeasure) {
        if (unitOfMeasure == null || unitOfMeasure.isBlank()) {
            return DEFAULT_UNIT_OF_MEASURE;
        }
        return unitOfMeasure.trim().toUpperCase();
    }

    private Integer normalizeQuantity(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalizeReason(String preferred, String fallback) {
        if (preferred == null || preferred.isBlank()) {
            return fallback;
        }
        return preferred.trim();
    }
}

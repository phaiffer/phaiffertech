package com.phaiffertech.platform.core.inventory.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovement;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementType;
import com.phaiffertech.platform.core.inventory.repository.InventoryItemRepository;
import com.phaiffertech.platform.core.inventory.repository.InventoryMovementRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryMovementService {

    private final InventoryMovementRepository movementRepository;
    private final InventoryItemRepository itemRepository;

    public InventoryMovementService(
            InventoryMovementRepository movementRepository,
            InventoryItemRepository itemRepository
    ) {
        this.movementRepository = movementRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "inventory_movement")
    public InventoryMovement createMovement(UUID tenantId, InventoryMovementCommand command) {
        InventoryMovement normalized = toNewEntity(command);
        InventoryItem item = lockItemOrThrow(tenantId, normalized.getInventoryItemId());

        applyMovement(item, normalized.getMovementType(), normalized.getQuantity());
        normalized.setTenantId(tenantId);
        normalized.setQuantityBefore(item.getCurrentQuantity() - signedQuantity(normalized));
        normalized.setQuantityAfter(item.getCurrentQuantity());

        itemRepository.save(item);
        return movementRepository.save(normalized);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "inventory_movement")
    public InventoryMovement updateMovement(UUID tenantId, UUID movementId, InventoryMovementCommand command) {
        InventoryMovement movement = getOrThrow(movementId, tenantId);
        ensureMovementIsMutable(movement);
        InventoryMovement normalized = toNewEntity(command);

        InventoryItem previousItem = lockItemOrThrow(tenantId, movement.getInventoryItemId());
        revertMovement(previousItem, movement);
        itemRepository.save(previousItem);

        InventoryItem nextItem = previousItem;
        if (!movement.getInventoryItemId().equals(normalized.getInventoryItemId())) {
            nextItem = lockItemOrThrow(tenantId, normalized.getInventoryItemId());
        }

        applyMovement(nextItem, normalized.getMovementType(), normalized.getQuantity());

        movement.setInventoryItemId(normalized.getInventoryItemId());
        movement.setMovementType(normalized.getMovementType());
        movement.setQuantity(normalized.getQuantity());
        movement.setSourceType(normalized.getSourceType());
        movement.setSourceReferenceId(normalized.getSourceReferenceId());
        movement.setReason(normalized.getReason());
        movement.setQuantityBefore(nextItem.getCurrentQuantity() - signedQuantity(normalized));
        movement.setQuantityAfter(nextItem.getCurrentQuantity());

        itemRepository.save(nextItem);
        return movementRepository.save(movement);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "inventory_movement")
    public void deleteMovement(UUID tenantId, UUID movementId) {
        InventoryMovement movement = getOrThrow(movementId, tenantId);
        ensureMovementIsMutable(movement);
        InventoryItem item = lockItemOrThrow(tenantId, movement.getInventoryItemId());

        revertMovement(item, movement);
        movement.setDeletedAt(Instant.now());

        itemRepository.save(item);
        movementRepository.save(movement);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "inventory_movement")
    public InventoryMovement restoreMovement(UUID tenantId, UUID movementId) {
        InventoryMovement movement = movementRepository.findByIdIncludingDeleted(movementId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory movement not found."));
        ensureMovementIsMutable(movement);
        if (movement.getDeletedAt() == null) {
            throw new ConflictOperationException("Inventory movement is already active.");
        }

        InventoryItem item = lockItemOrThrow(tenantId, movement.getInventoryItemId());
        applyMovement(item, movement.getMovementType(), movement.getQuantity());
        movement.setDeletedAt(null);
        movement.setQuantityBefore(item.getCurrentQuantity() - signedQuantity(movement));
        movement.setQuantityAfter(item.getCurrentQuantity());

        itemRepository.save(item);
        return movementRepository.save(movement);
    }

    private InventoryMovement getOrThrow(UUID movementId, UUID tenantId) {
        return movementRepository.findByIdAndTenantId(movementId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory movement not found."));
    }

    private void ensureMovementIsMutable(InventoryMovement movement) {
        if (movement.getSourceType() == com.phaiffertech.platform.core.inventory.domain.InventoryMovementSource.PET_APPOINTMENT_SERVICE_CONSUMPTION) {
            throw new ConflictOperationException(
                    "Appointment-applied inventory movements require a dedicated reversal flow and cannot be edited, deleted or restored."
            );
        }
    }

    private InventoryMovement toNewEntity(InventoryMovementCommand command) {
        validateCommand(command);

        InventoryMovement movement = new InventoryMovement();
        movement.setInventoryItemId(command.inventoryItemId());
        movement.setMovementType(command.movementType());
        movement.setQuantity(command.quantity());
        movement.setSourceType(command.sourceType());
        movement.setSourceReferenceId(command.sourceReferenceId());
        movement.setReason(command.reason().trim());
        return movement;
    }

    private void validateCommand(InventoryMovementCommand command) {
        if (command.inventoryItemId() == null) {
            throw new IllegalArgumentException("Inventory item is required.");
        }
        if (command.movementType() == null) {
            throw new IllegalArgumentException("Inventory movement type is required.");
        }
        if (command.sourceType() == null) {
            throw new IllegalArgumentException("Inventory movement source is required.");
        }
        if (command.quantity() == null || command.quantity() < 1) {
            throw new IllegalArgumentException("Inventory movement quantity must be positive.");
        }
        if (command.reason() == null || command.reason().isBlank()) {
            throw new IllegalArgumentException("Inventory movement reason is required.");
        }
    }

    private InventoryItem lockItemOrThrow(UUID tenantId, UUID inventoryItemId) {
        return itemRepository.findLockedByIdAndTenantId(inventoryItemId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for tenant."));
    }

    private void applyMovement(InventoryItem item, InventoryMovementType type, int quantity) {
        int nextQuantity = item.getCurrentQuantity() + signedQuantity(type, quantity);
        if (nextQuantity < 0) {
            throw new IllegalArgumentException("Inventory movement would result in negative stock.");
        }
        item.setCurrentQuantity(nextQuantity);
    }

    private void revertMovement(InventoryItem item, InventoryMovement movement) {
        int nextQuantity = item.getCurrentQuantity() - signedQuantity(movement);
        if (nextQuantity < 0) {
            throw new IllegalArgumentException("Inventory movement revert would result in negative stock.");
        }
        item.setCurrentQuantity(nextQuantity);
    }

    private int signedQuantity(InventoryMovement movement) {
        return signedQuantity(movement.getMovementType(), movement.getQuantity());
    }

    private int signedQuantity(InventoryMovementType type, int quantity) {
        return InventoryMovementType.IN.equals(type) ? quantity : -quantity;
    }
}

package com.phaiffertech.platform.modules.iot.part.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.core.inventory.domain.InventoryItemCategory;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovement;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementSource;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementType;
import com.phaiffertech.platform.core.inventory.repository.InventoryMovementRepository;
import com.phaiffertech.platform.core.inventory.service.InventoryItemService;
import com.phaiffertech.platform.core.inventory.service.InventoryItemUpsertCommand;
import com.phaiffertech.platform.core.inventory.service.InventoryMovementCommand;
import com.phaiffertech.platform.core.inventory.service.InventoryMovementService;
import com.phaiffertech.platform.modules.iot.maintenance.repository.IotMaintenanceRepository;
import com.phaiffertech.platform.modules.iot.part.domain.IotPart;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartCreateRequest;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartMovementCreateRequest;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartMovementResponse;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartResponse;
import com.phaiffertech.platform.modules.iot.part.dto.IotPartUpdateRequest;
import com.phaiffertech.platform.modules.iot.part.repository.IotPartRepository;
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
public class IotPartService {

    private final IotPartRepository repository;
    private final InventoryItemService inventoryItemService;
    private final InventoryMovementService inventoryMovementService;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final IotMaintenanceRepository maintenanceRepository;

    public IotPartService(
            IotPartRepository repository,
            InventoryItemService inventoryItemService,
            InventoryMovementService inventoryMovementService,
            InventoryMovementRepository inventoryMovementRepository,
            IotMaintenanceRepository maintenanceRepository
    ) {
        this.repository = repository;
        this.inventoryItemService = inventoryItemService;
        this.inventoryMovementService = inventoryMovementService;
        this.inventoryMovementRepository = inventoryMovementRepository;
        this.maintenanceRepository = maintenanceRepository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_part")
    public IotPartResponse create(IotPartCreateRequest request) {
        UUID tenantId = currentTenantId();
        InventoryItem item = inventoryItemService.createCatalogItem(
                tenantId,
                toInventoryCommand(request),
                InventoryMovementSource.IOT_PART_SYNC,
                null,
                "Initial balance registered from IoT parts catalog."
        );

        IotPart part = new IotPart();
        part.setTenantId(tenantId);
        part.setInventoryItemId(item.getId());
        part.setDescription(trimToNull(request.description()));

        return toResponse(repository.save(part), item);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<IotPartResponse> list(PageRequestDto pageRequest, String category) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.ASC, "createdAt"));
        String normalizedCategory = normalizeIotCategory(category) == null ? null : normalizeIotCategory(category).name();
        Page<IotPart> parts = repository.findAllByTenantIdAndSearch(
                tenantId,
                normalizedCategory,
                query.search(),
                query.pageable()
        );

        Map<UUID, InventoryItem> itemsById = inventoryItemService.getAllByIds(
                tenantId,
                parts.getContent().stream().map(IotPart::getInventoryItemId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(InventoryItem::getId, Function.identity()));

        return PaginationUtils.fromPage(parts.map(part -> toResponse(part, requireInventoryItem(part, itemsById))));
    }

    @Transactional(readOnly = true)
    public IotPartResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        IotPart part = getOrThrow(id, tenantId);
        return toResponse(part, inventoryItemService.getOrThrow(part.getInventoryItemId(), tenantId));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "iot_part")
    public IotPartResponse update(UUID id, IotPartUpdateRequest request) {
        UUID tenantId = currentTenantId();
        IotPart part = getOrThrow(id, tenantId);
        InventoryItem item = inventoryItemService.updateCatalogItem(
                tenantId,
                part.getInventoryItemId(),
                toInventoryCommand(request),
                InventoryMovementSource.IOT_PART_SYNC,
                part.getId(),
                "Inventory balance synchronized from IoT parts catalog."
        );

        part.setDescription(trimToNull(request.description()));
        return toResponse(repository.save(part), item);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "iot_part")
    public void delete(UUID id) {
        UUID tenantId = currentTenantId();
        IotPart part = getOrThrow(id, tenantId);
        inventoryItemService.softDelete(tenantId, part.getInventoryItemId());
        part.setDeletedAt(Instant.now());
        repository.save(part);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "iot_part")
    public IotPartResponse restore(UUID id) {
        UUID tenantId = currentTenantId();
        IotPart part = repository.findByIdIncludingDeleted(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT part not found."));
        part.setDeletedAt(null);
        InventoryItem item = inventoryItemService.restore(tenantId, part.getInventoryItemId());
        return toResponse(repository.save(part), item);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<IotPartMovementResponse> listMovements(
            PageRequestDto pageRequest,
            UUID partId,
            String movementType
    ) {
        UUID tenantId = currentTenantId();
        UUID inventoryItemId = partId == null ? null : getOrThrow(partId, tenantId).getInventoryItemId();
        BasePageQuery query = new BasePageQuery(
                PaginationUtils.toPageableWithoutSort(pageRequest),
                pageRequest == null ? "%" : pageRequest.normalizedSearchPattern()
        );
        Page<InventoryMovement> movements = inventoryMovementRepository.findAllByTenantIdAndSearch(
                tenantId,
                inventoryItemId,
                movementType == null ? null : normalizeMovementType(movementType).name(),
                query.search(),
                query.pageable()
        );

        Map<UUID, IotPart> partsByInventoryItemId = repository.findAllByTenantIdAndInventoryItemIdIn(
                tenantId,
                movements.getContent().stream().map(InventoryMovement::getInventoryItemId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(IotPart::getInventoryItemId, Function.identity()));

        Map<UUID, InventoryItem> itemsById = inventoryItemService.getAllByIds(
                tenantId,
                partsByInventoryItemId.keySet()
        ).stream().collect(Collectors.toMap(InventoryItem::getId, Function.identity()));

        return PaginationUtils.fromPage(movements.map(movement -> toMovementResponse(
                movement,
                partsByInventoryItemId.get(movement.getInventoryItemId()),
                itemsById.get(movement.getInventoryItemId())
        )));
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "iot_part_movement")
    public IotPartMovementResponse createMovement(UUID partId, IotPartMovementCreateRequest request) {
        UUID tenantId = currentTenantId();
        IotPart part = getOrThrow(partId, tenantId);
        InventoryItem item = inventoryItemService.getOrThrow(part.getInventoryItemId(), tenantId);
        UUID maintenanceId = validateMaintenanceReference(tenantId, request.maintenanceId());

        InventoryMovement movement = inventoryMovementService.createMovement(
                tenantId,
                new InventoryMovementCommand(
                        item.getId(),
                        normalizeMovementType(request.movementType()),
                        request.quantity(),
                        resolveMovementSource(request.maintenanceId(), normalizeMovementType(request.movementType())),
                        maintenanceId != null ? maintenanceId : part.getId(),
                        resolveMovementReason(request.reason(), request.maintenanceId())
                )
        );

        return toMovementResponse(movement, part, item);
    }

    private IotPart getOrThrow(UUID partId, UUID tenantId) {
        return repository.findByIdAndTenantId(partId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT part not found."));
    }

    private InventoryItemUpsertCommand toInventoryCommand(IotPartCreateRequest request) {
        return new InventoryItemUpsertCommand(
                request.name(),
                request.sku(),
                resolveIotCategory(request.category()),
                request.unitOfMeasure(),
                request.currentQuantity(),
                request.minimumQuantity(),
                request.reorderPoint()
        );
    }

    private InventoryItemUpsertCommand toInventoryCommand(IotPartUpdateRequest request) {
        return new InventoryItemUpsertCommand(
                request.name(),
                request.sku(),
                resolveIotCategory(request.category()),
                request.unitOfMeasure(),
                request.currentQuantity(),
                request.minimumQuantity(),
                request.reorderPoint()
        );
    }

    private InventoryItemCategory normalizeIotCategory(String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        InventoryItemCategory resolved;
        try {
            resolved = InventoryItemCategory.valueOf(category.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid category. Valid IoT values are: IOT_SPARE_PART, IOT_CONSUMABLE");
        }
        if (!resolved.isIotCategory()) {
            throw new IllegalArgumentException("Invalid category. Valid IoT values are: IOT_SPARE_PART, IOT_CONSUMABLE");
        }
        return resolved;
    }

    private InventoryItemCategory resolveIotCategory(String category) {
        InventoryItemCategory resolved = normalizeIotCategory(category);
        return resolved == null ? InventoryItemCategory.IOT_SPARE_PART : resolved;
    }

    private InventoryMovementType normalizeMovementType(String movementType) {
        if (movementType == null || movementType.isBlank()) {
            return null;
        }
        return InventoryMovementType.valueOf(movementType.trim().toUpperCase());
    }

    private InventoryMovementSource resolveMovementSource(UUID maintenanceId, InventoryMovementType movementType) {
        if (InventoryMovementType.IN.equals(movementType)) {
            return InventoryMovementSource.MANUAL;
        }
        if (maintenanceId != null) {
            return InventoryMovementSource.IOT_MAINTENANCE_CONSUMPTION;
        }
        return InventoryMovementSource.IOT_PART_REPLACEMENT;
    }

    private String resolveMovementReason(String reason, UUID maintenanceId) {
        if (reason != null && !reason.isBlank()) {
            return reason.trim();
        }
        if (maintenanceId != null) {
            return "Part consumed by IoT maintenance order.";
        }
        return "IoT part stock movement recorded manually.";
    }

    private UUID validateMaintenanceReference(UUID tenantId, UUID maintenanceId) {
        if (maintenanceId == null) {
            return null;
        }
        maintenanceRepository.findByIdAndTenantId(maintenanceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("IoT maintenance not found for tenant."));
        return maintenanceId;
    }

    private InventoryItem requireInventoryItem(IotPart part, Map<UUID, InventoryItem> itemsById) {
        InventoryItem item = itemsById.get(part.getInventoryItemId());
        if (item == null) {
            throw new ResourceNotFoundException("Inventory item not found for IoT part.");
        }
        return item;
    }

    private IotPartResponse toResponse(IotPart part, InventoryItem item) {
        return new IotPartResponse(
                part.getId(),
                item.getName(),
                item.getSku(),
                item.getCategory().name(),
                item.getUnitOfMeasure(),
                item.getCurrentQuantity(),
                item.getMinimumQuantity(),
                item.getReorderPoint(),
                part.getDescription(),
                part.getCreatedAt(),
                part.getUpdatedAt()
        );
    }

    private IotPartMovementResponse toMovementResponse(
            InventoryMovement movement,
            IotPart part,
            InventoryItem item
    ) {
        return new IotPartMovementResponse(
                movement.getId(),
                part == null ? null : part.getId(),
                item == null ? null : item.getName(),
                item == null ? null : item.getSku(),
                movement.getMovementType().name(),
                movement.getQuantity(),
                movement.getSourceType().name(),
                movement.getReason(),
                movement.getQuantityBefore(),
                movement.getQuantityAfter(),
                movement.getCreatedAt(),
                movement.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private UUID currentTenantId() {
        return TenantContext.getRequiredTenantId();
    }
}

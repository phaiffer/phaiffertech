package com.phaiffertech.platform.modules.pet.servicecatalog.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.core.inventory.repository.InventoryItemRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCategory;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryLink;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogCreateRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogResponse;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogUpdateRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceInventoryLinkRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceInventoryLinkResponse;
import com.phaiffertech.platform.modules.pet.servicecatalog.mapper.PetServiceCatalogMapper;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceInventoryLinkRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetServiceCatalogService extends BaseTenantCrudService<
        PetServiceCatalog,
        PetServiceCatalogCreateRequest,
        PetServiceCatalogUpdateRequest,
        PetServiceCatalogResponse> {

    private final PetServiceCatalogRepository repository;
    private final PetServiceCatalogCategoryPolicyService categoryPolicyService;
    private final PetServiceInventoryLinkRepository inventoryLinkRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public PetServiceCatalogService(
            PetServiceCatalogRepository repository,
            PetServiceCatalogCategoryPolicyService categoryPolicyService,
            PetServiceInventoryLinkRepository inventoryLinkRepository,
            InventoryItemRepository inventoryItemRepository
    ) {
        super(repository, repository, PetServiceCatalogMapper.INSTANCE, "Pet service not found.");
        this.repository = repository;
        this.categoryPolicyService = categoryPolicyService;
        this.inventoryLinkRepository = inventoryLinkRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetServiceCatalogCreateRequest request, PetServiceCatalog entity) {
        categoryPolicyService.validateCategoryAccess(tenantId, entity.getCategory());
        validateSchedulingConfiguration(entity);
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetServiceCatalogUpdateRequest request, PetServiceCatalog entity) {
        categoryPolicyService.validateCategoryAccess(tenantId, entity.getCategory());
        validateSchedulingConfiguration(entity);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_service")
    public PetServiceCatalogResponse create(PetServiceCatalogCreateRequest request) {
        UUID tenantId = currentTenantId();
        PetServiceCatalog entity = PetServiceCatalogMapper.INSTANCE.toNewEntity(request);
        entity.setTenantId(tenantId);

        beforeCreate(tenantId, request, entity);

        PetServiceCatalog saved = repository.save(entity);
        replaceInventoryLinks(tenantId, saved.getId(), request.inventoryLinks());
        return toResponse(saved, tenantId);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetServiceCatalogResponse> list(
            PageRequestDto pageRequest,
            PetServiceCategory category,
            Boolean active
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.ASC, "name"));
        Page<PetServiceCatalog> services = repository.findAllByTenantIdAndFilters(
                tenantId,
                categoryPolicyService.resolveAllowedCategories(tenantId),
                category,
                active,
                query.search(),
                query.pageable()
        );
        Map<UUID, List<PetServiceInventoryLinkResponse>> linksByServiceId = loadInventoryLinksByServiceId(
                tenantId,
                services.getContent().stream().map(PetServiceCatalog::getId).toList()
        );

        return PaginationUtils.fromPage(services.map(service -> PetServiceCatalogMapper.INSTANCE.toResponse(
                service,
                linksByServiceId.getOrDefault(service.getId(), List.of())
        )));
    }

    @Transactional(readOnly = true)
    public PetServiceCatalogResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        PetServiceCatalog entity = getOrThrow(id, tenantId);
        categoryPolicyService.validateCategoryAccess(tenantId, entity.getCategory());
        return toResponse(entity, tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_service")
    public PetServiceCatalogResponse update(UUID id, PetServiceCatalogUpdateRequest request) {
        UUID tenantId = currentTenantId();
        PetServiceCatalog entity = getOrThrow(id, tenantId);
        categoryPolicyService.validateCategoryAccess(tenantId, entity.getCategory());

        PetServiceCatalogMapper.INSTANCE.updateEntity(entity, request);
        beforeUpdate(tenantId, request, entity);

        PetServiceCatalog saved = repository.save(entity);
        if (request.inventoryLinks() != null) {
            replaceInventoryLinks(tenantId, saved.getId(), request.inventoryLinks());
        }
        return toResponse(saved, tenantId);
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
        PetServiceCatalog entity = getIncludingDeletedOrThrow(id, tenantId);
        categoryPolicyService.validateCategoryAccess(tenantId, entity.getCategory());
        entity.setDeletedAt(null);
        return toResponse(repository.save(entity), tenantId);
    }

    private void validateSchedulingConfiguration(PetServiceCatalog entity) {
        if (!entity.isActive()) {
            return;
        }

        if (entity.isAllowInPlans() || entity.isAllowStandaloneBooking()) {
            return;
        }

        throw new ConflictOperationException(
                "Active Pet services must allow standalone booking or plan-based scheduling."
        );
    }

    private void replaceInventoryLinks(
            UUID tenantId,
            UUID serviceId,
            List<PetServiceInventoryLinkRequest> requestedLinks
    ) {
        inventoryLinkRepository.deleteAllByTenantIdAndServiceId(tenantId, serviceId);

        if (requestedLinks == null || requestedLinks.isEmpty()) {
            return;
        }

        validateUniqueInventoryItems(requestedLinks);
        Map<UUID, InventoryItem> itemsById = loadInventoryItemsOrThrow(
                tenantId,
                requestedLinks.stream().map(PetServiceInventoryLinkRequest::inventoryItemId).toList()
        );

        List<PetServiceInventoryLink> links = requestedLinks.stream()
                .map(request -> toInventoryLink(tenantId, serviceId, request, itemsById.get(request.inventoryItemId())))
                .toList();
        inventoryLinkRepository.saveAll(links);
    }

    private void validateUniqueInventoryItems(List<PetServiceInventoryLinkRequest> requestedLinks) {
        LinkedHashSet<UUID> uniqueIds = new LinkedHashSet<>();
        for (PetServiceInventoryLinkRequest request : requestedLinks) {
            if (!uniqueIds.add(request.inventoryItemId())) {
                throw new ConflictOperationException(
                        "Pet service cannot repeat the same inventory item in a single recipe."
                );
            }
        }
    }

    private Map<UUID, InventoryItem> loadInventoryItemsOrThrow(UUID tenantId, Collection<UUID> inventoryItemIds) {
        Map<UUID, InventoryItem> itemsById = inventoryItemRepository.findAllByTenantIdAndIdIn(tenantId, inventoryItemIds)
                .stream()
                .collect(Collectors.toMap(InventoryItem::getId, Function.identity()));

        if (itemsById.size() != inventoryItemIds.size()) {
            throw new ResourceNotFoundException("Inventory item not found for tenant.");
        }

        return itemsById;
    }

    private PetServiceInventoryLink toInventoryLink(
            UUID tenantId,
            UUID serviceId,
            PetServiceInventoryLinkRequest request,
            InventoryItem item
    ) {
        if (item == null) {
            throw new ResourceNotFoundException("Inventory item not found for tenant.");
        }
        if (item.getCategory() == null || !item.getCategory().isPetCategory()) {
            throw new ConflictOperationException(
                    "Pet service inventory links must reference a PetFlow inventory item."
            );
        }

        PetServiceInventoryLink link = new PetServiceInventoryLink();
        link.setTenantId(tenantId);
        link.setServiceId(serviceId);
        link.setInventoryItemId(request.inventoryItemId());
        link.setExpectedQuantity(request.expectedQuantity());
        link.setConsumptionRule(request.consumptionRule());
        link.setActive(Boolean.TRUE.equals(request.active()));
        return link;
    }

    private PetServiceCatalogResponse toResponse(PetServiceCatalog service, UUID tenantId) {
        return PetServiceCatalogMapper.INSTANCE.toResponse(
                service,
                loadInventoryLinksByServiceId(tenantId, List.of(service.getId())).getOrDefault(service.getId(), List.of())
        );
    }

    private Map<UUID, List<PetServiceInventoryLinkResponse>> loadInventoryLinksByServiceId(
            UUID tenantId,
            Collection<UUID> serviceIds
    ) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            return Map.of();
        }

        List<PetServiceInventoryLink> links = inventoryLinkRepository
                .findAllByTenantIdAndServiceIdInOrderByServiceIdAscCreatedAtAsc(tenantId, serviceIds);

        if (links.isEmpty()) {
            return Map.of();
        }

        Map<UUID, InventoryItem> itemsById = inventoryItemRepository
                .findAllByTenantIdAndIdInIncludingDeleted(
                        tenantId,
                        links.stream().map(PetServiceInventoryLink::getInventoryItemId).collect(Collectors.toSet())
                )
                .stream()
                .collect(Collectors.toMap(InventoryItem::getId, Function.identity()));

        Map<UUID, List<PetServiceInventoryLinkResponse>> grouped = new LinkedHashMap<>();
        for (PetServiceInventoryLink link : links) {
            grouped.computeIfAbsent(link.getServiceId(), ignored -> new java.util.ArrayList<>())
                    .add(toInventoryLinkResponse(link, itemsById.get(link.getInventoryItemId())));
        }
        return grouped;
    }

    private PetServiceInventoryLinkResponse toInventoryLinkResponse(PetServiceInventoryLink link, InventoryItem item) {
        return new PetServiceInventoryLinkResponse(
                link.getId(),
                link.getInventoryItemId(),
                item == null ? "Unavailable inventory item" : item.getName(),
                item == null ? null : item.getSku(),
                item == null || item.getCategory() == null ? null : item.getCategory().name(),
                item == null ? "UNIT" : item.getUnitOfMeasure(),
                link.getExpectedQuantity(),
                link.getConsumptionRule(),
                link.isActive()
        );
    }
}

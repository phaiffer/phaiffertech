package com.phaiffertech.platform.modules.pet.inventory.service;

import com.phaiffertech.platform.core.inventory.domain.InventoryMovement;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementSource;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementType;
import com.phaiffertech.platform.core.inventory.repository.InventoryMovementRepository;
import com.phaiffertech.platform.core.inventory.service.InventoryItemService;
import com.phaiffertech.platform.core.inventory.service.InventoryMovementService;
import com.phaiffertech.platform.modules.pet.inventory.dto.PetInventoryMovementResponse;
import com.phaiffertech.platform.modules.pet.product.domain.PetProduct;
import com.phaiffertech.platform.modules.pet.product.repository.PetProductRepository;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PetInventoryMovementServiceTest {

    private final InventoryMovementRepository movementRepository = mock(InventoryMovementRepository.class);
    private final PetProductRepository productRepository = mock(PetProductRepository.class);
    private final PetInventoryMovementService service = new PetInventoryMovementService(
            movementRepository,
            mock(InventoryMovementService.class),
            mock(InventoryItemService.class),
            productRepository
    );

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void listReturnsEmptyPageWithoutFilters() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        when(movementRepository.findAllByTenantIdAndSearch(
                eq(tenantId),
                eq("%"),
                any(Pageable.class)
        )).thenReturn(Page.empty());

        PageResponseDto<PetInventoryMovementResponse> response =
                service.list(new PageRequestDto(0, 10, null, null, null), null, null);

        assertEquals(0, response.items().size());
        assertEquals(0, response.totalItems());
        verify(movementRepository).findAllByTenantIdAndSearch(eq(tenantId), eq("%"), any(Pageable.class));
    }

    @Test
    void listReturnsMovementsWithProductsWithoutFilters() {
        UUID tenantId = UUID.randomUUID();
        UUID movementId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID inventoryItemId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        PetProduct product = product(productId, tenantId, inventoryItemId);
        InventoryMovement movement = movement(movementId, tenantId, inventoryItemId, InventoryMovementType.OUT);

        when(movementRepository.findAllByTenantIdAndSearch(
                eq(tenantId),
                eq("%"),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(movement)));
        when(productRepository.findAllByTenantIdAndInventoryItemIdIn(eq(tenantId), eq(Set.of(inventoryItemId))))
                .thenReturn(List.of(product));

        PageResponseDto<PetInventoryMovementResponse> response =
                service.list(new PageRequestDto(0, 10, null, null, null), null, null);

        assertEquals(1, response.items().size());
        assertEquals(productId, response.items().get(0).productId());
        assertEquals("Shampoo neutro", response.items().get(0).productName());
        assertEquals("OUT", response.items().get(0).movementType());
    }

    @Test
    void listUsesNonNullFilterQueriesForOptionalFilters() {
        UUID tenantId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID inventoryItemId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        PetProduct product = product(productId, tenantId, inventoryItemId);

        when(productRepository.findByIdAndTenantId(productId, tenantId)).thenReturn(Optional.of(product));
        when(movementRepository.findAllByTenantIdAndInventoryItemIdAndSearch(
                eq(tenantId),
                eq(inventoryItemId),
                eq("%"),
                any(Pageable.class)
        )).thenReturn(Page.empty());
        when(movementRepository.findAllByTenantIdAndMovementTypeAndSearch(
                eq(tenantId),
                eq("IN"),
                eq("%"),
                any(Pageable.class)
        )).thenReturn(Page.empty());
        when(movementRepository.findAllByTenantIdAndInventoryItemIdAndMovementTypeAndSearch(
                eq(tenantId),
                eq(inventoryItemId),
                eq("OUT"),
                eq("%"),
                any(Pageable.class)
        )).thenReturn(Page.empty());

        PageRequestDto pageRequest = new PageRequestDto(0, 10, null, null, null);

        service.list(pageRequest, productId, null);
        service.list(pageRequest, null, "in");
        service.list(pageRequest, productId, "out");

        verify(movementRepository).findAllByTenantIdAndInventoryItemIdAndSearch(
                eq(tenantId),
                eq(inventoryItemId),
                eq("%"),
                any(Pageable.class)
        );
        verify(movementRepository).findAllByTenantIdAndMovementTypeAndSearch(
                eq(tenantId),
                eq("IN"),
                eq("%"),
                any(Pageable.class)
        );
        verify(movementRepository).findAllByTenantIdAndInventoryItemIdAndMovementTypeAndSearch(
                eq(tenantId),
                eq(inventoryItemId),
                eq("OUT"),
                eq("%"),
                any(Pageable.class)
        );
    }

    private PetProduct product(UUID id, UUID tenantId, UUID inventoryItemId) {
        PetProduct product = new PetProduct();
        ReflectionTestUtils.setField(product, "id", id);
        product.setTenantId(tenantId);
        product.setInventoryItemId(inventoryItemId);
        product.setName("Shampoo neutro");
        product.setSku("SH-001");
        return product;
    }

    private InventoryMovement movement(
            UUID id,
            UUID tenantId,
            UUID inventoryItemId,
            InventoryMovementType movementType
    ) {
        InventoryMovement movement = new InventoryMovement();
        ReflectionTestUtils.setField(movement, "id", id);
        movement.setTenantId(tenantId);
        movement.setInventoryItemId(inventoryItemId);
        movement.setMovementType(movementType);
        movement.setQuantity(2);
        movement.setQuantityBefore(5);
        movement.setQuantityAfter(3);
        movement.setSourceType(InventoryMovementSource.PET_RETAIL_SALE);
        movement.setReason("Uso operacional");
        return movement;
    }
}

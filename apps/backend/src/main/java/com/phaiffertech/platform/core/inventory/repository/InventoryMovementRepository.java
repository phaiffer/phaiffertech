package com.phaiffertech.platform.core.inventory.repository;

import com.phaiffertech.platform.core.inventory.domain.InventoryMovement;
import com.phaiffertech.platform.core.inventory.domain.InventoryMovementType;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryMovementRepository
        extends JpaRepository<InventoryMovement, UUID>, BaseTenantCrudRepository<InventoryMovement> {

    Optional<InventoryMovement> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM inventory_movements m
            WHERE m.id = :id
              AND m.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<InventoryMovement> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );

    @Query("""
            SELECT m
            FROM InventoryMovement m
            WHERE m.tenantId = :tenantId
              AND m.deletedAt IS NULL
              AND (:search = '%' OR
                   LOWER(COALESCE(m.reason, '')) LIKE :search)
            ORDER BY m.createdAt DESC
            """)
    Page<InventoryMovement> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            SELECT m
            FROM InventoryMovement m
            WHERE m.tenantId = :tenantId
              AND m.deletedAt IS NULL
              AND m.inventoryItemId = :inventoryItemId
              AND (:search = '%' OR
                   LOWER(COALESCE(m.reason, '')) LIKE :search)
            ORDER BY m.createdAt DESC
            """)
    Page<InventoryMovement> findAllByTenantIdAndInventoryItemIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("inventoryItemId") UUID inventoryItemId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            SELECT m
            FROM InventoryMovement m
            WHERE m.tenantId = :tenantId
              AND m.deletedAt IS NULL
              AND m.movementType = :movementType
              AND (:search = '%' OR
                   LOWER(COALESCE(m.reason, '')) LIKE :search)
            ORDER BY m.createdAt DESC
            """)
    Page<InventoryMovement> findAllByTenantIdAndMovementTypeAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("movementType") InventoryMovementType movementType,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            SELECT m
            FROM InventoryMovement m
            WHERE m.tenantId = :tenantId
              AND m.deletedAt IS NULL
              AND m.inventoryItemId = :inventoryItemId
              AND m.movementType = :movementType
              AND (:search = '%' OR
                   LOWER(COALESCE(m.reason, '')) LIKE :search)
            ORDER BY m.createdAt DESC
            """)
    Page<InventoryMovement> findAllByTenantIdAndInventoryItemIdAndMovementTypeAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("inventoryItemId") UUID inventoryItemId,
            @Param("movementType") InventoryMovementType movementType,
            @Param("search") String search,
            Pageable pageable
    );
}
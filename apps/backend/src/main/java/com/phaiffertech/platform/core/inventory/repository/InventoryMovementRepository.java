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

    @Query(value = """
            SELECT *
            FROM inventory_movements m
            WHERE m.tenant_id = :tenantId
              AND m.deleted_at IS NULL
              AND (:search = '%' OR
                   LOWER(COALESCE(m.reason, '')) LIKE :search OR
                   LOWER(m.source_type) LIKE :search)
            ORDER BY m.created_at DESC
            """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM inventory_movements m
                    WHERE m.tenant_id = :tenantId
                      AND m.deleted_at IS NULL
                      AND (:search = '%' OR
                           LOWER(COALESCE(m.reason, '')) LIKE :search OR
                           LOWER(m.source_type) LIKE :search)
                    """,
            nativeQuery = true)
    Page<InventoryMovement> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query(value = """
            SELECT *
            FROM inventory_movements m
            WHERE m.tenant_id = :tenantId
              AND m.deleted_at IS NULL
              AND m.inventory_item_id = :inventoryItemId
              AND (:search = '%' OR
                   LOWER(COALESCE(m.reason, '')) LIKE :search OR
                   LOWER(m.source_type) LIKE :search)
            ORDER BY m.created_at DESC
            """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM inventory_movements m
                    WHERE m.tenant_id = :tenantId
                      AND m.deleted_at IS NULL
                      AND m.inventory_item_id = :inventoryItemId
                      AND (:search = '%' OR
                           LOWER(COALESCE(m.reason, '')) LIKE :search OR
                           LOWER(m.source_type) LIKE :search)
                    """,
            nativeQuery = true)
    Page<InventoryMovement> findAllByTenantIdAndInventoryItemIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("inventoryItemId") UUID inventoryItemId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query(value = """
            SELECT *
            FROM inventory_movements m
            WHERE m.tenant_id = :tenantId
              AND m.deleted_at IS NULL
              AND m.movement_type = :movementType
              AND (:search = '%' OR
                   LOWER(COALESCE(m.reason, '')) LIKE :search OR
                   LOWER(m.source_type) LIKE :search)
            ORDER BY m.created_at DESC
            """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM inventory_movements m
                    WHERE m.tenant_id = :tenantId
                      AND m.deleted_at IS NULL
                      AND m.movement_type = :movementType
                      AND (:search = '%' OR
                           LOWER(COALESCE(m.reason, '')) LIKE :search OR
                           LOWER(m.source_type) LIKE :search)
                    """,
            nativeQuery = true)
    Page<InventoryMovement> findAllByTenantIdAndMovementTypeAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("movementType") String movementType,
            @Param("search") String search,
            Pageable pageable
    );

    @Query(value = """
            SELECT *
            FROM inventory_movements m
            WHERE m.tenant_id = :tenantId
              AND m.deleted_at IS NULL
              AND m.inventory_item_id = :inventoryItemId
              AND m.movement_type = :movementType
              AND (:search = '%' OR
                   LOWER(COALESCE(m.reason, '')) LIKE :search OR
                   LOWER(m.source_type) LIKE :search)
            ORDER BY m.created_at DESC
            """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM inventory_movements m
                    WHERE m.tenant_id = :tenantId
                      AND m.deleted_at IS NULL
                      AND m.inventory_item_id = :inventoryItemId
                      AND m.movement_type = :movementType
                      AND (:search = '%' OR
                           LOWER(COALESCE(m.reason, '')) LIKE :search OR
                           LOWER(m.source_type) LIKE :search)
                    """,
            nativeQuery = true)
    Page<InventoryMovement> findAllByTenantIdAndInventoryItemIdAndMovementTypeAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("inventoryItemId") UUID inventoryItemId,
            @Param("movementType") String movementType,
            @Param("search") String search,
            Pageable pageable
    );
}

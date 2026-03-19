package com.phaiffertech.platform.modules.iot.part.repository;

import com.phaiffertech.platform.modules.iot.part.domain.IotPart;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IotPartRepository extends JpaRepository<IotPart, UUID>, BaseTenantCrudRepository<IotPart> {

    @Query(value = """
            SELECT p.*
            FROM iot_parts p
            JOIN inventory_items i ON i.id = p.inventory_item_id
            WHERE p.tenant_id = :tenantId
              AND p.deleted_at IS NULL
              AND i.deleted_at IS NULL
              AND (:category IS NULL OR i.category = :category)
              AND (:search = '%' OR
                   LOWER(i.name) LIKE :search OR
                   LOWER(i.sku) LIKE :search OR
                   LOWER(COALESCE(p.description, '')) LIKE :search)
            """,
            countQuery = """
                    SELECT COUNT(*)
                    FROM iot_parts p
                    JOIN inventory_items i ON i.id = p.inventory_item_id
                    WHERE p.tenant_id = :tenantId
                      AND p.deleted_at IS NULL
                      AND i.deleted_at IS NULL
                      AND (:category IS NULL OR i.category = :category)
                      AND (:search = '%' OR
                           LOWER(i.name) LIKE :search OR
                           LOWER(i.sku) LIKE :search OR
                           LOWER(COALESCE(p.description, '')) LIKE :search)
                    """,
            nativeQuery = true)
    Page<IotPart> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("category") String category,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<IotPart> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<IotPart> findByInventoryItemIdAndTenantId(UUID inventoryItemId, UUID tenantId);

    List<IotPart> findAllByTenantIdAndInventoryItemIdIn(UUID tenantId, Collection<UUID> inventoryItemIds);

    @Query(value = """
            SELECT *
            FROM iot_parts p
            WHERE p.id = :id
              AND p.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<IotPart> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

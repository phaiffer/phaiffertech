package com.phaiffertech.platform.core.inventory.repository;

import com.phaiffertech.platform.core.inventory.domain.InventoryItem;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID>, BaseTenantCrudRepository<InventoryItem> {

    boolean existsBySkuAndTenantId(String sku, UUID tenantId);

    boolean existsBySkuAndTenantIdAndIdNot(String sku, UUID tenantId, UUID id);

    Optional<InventoryItem> findByIdAndTenantId(UUID id, UUID tenantId);

    List<InventoryItem> findAllByTenantIdAndIdIn(UUID tenantId, Collection<UUID> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT i
            FROM InventoryItem i
            WHERE i.id = :id
              AND i.tenantId = :tenantId
            """)
    Optional<InventoryItem> findLockedByIdAndTenantId(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );

    @Query(value = """
            SELECT *
            FROM inventory_items i
            WHERE i.id = :id
              AND i.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<InventoryItem> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

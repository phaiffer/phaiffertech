package com.phaiffertech.platform.modules.pet.product.repository;

import com.phaiffertech.platform.modules.pet.product.domain.PetProduct;
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

public interface PetProductRepository extends JpaRepository<PetProduct, UUID>, BaseTenantCrudRepository<PetProduct> {

    @Query(value = """
            SELECT COUNT(*)
            FROM pet_products p
            JOIN inventory_items i ON i.id = p.inventory_item_id
            WHERE p.tenant_id = :tenantId
              AND p.deleted_at IS NULL
              AND i.deleted_at IS NULL
              AND i.current_quantity <= CASE
                    WHEN i.reorder_point > 0 THEN i.reorder_point
                    ELSE :defaultThreshold
                  END
            """, nativeQuery = true)
    long countLowStockProducts(
            @Param("tenantId") UUID tenantId,
            @Param("defaultThreshold") int defaultThreshold
    );

    @Query("""
            SELECT p
            FROM PetProduct p
            WHERE p.tenantId = :tenantId
              AND (:search = '%' OR
                   LOWER(p.name) LIKE :search OR
                   LOWER(p.sku) LIKE :search)
            """)
    Page<PetProduct> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetProduct> findByIdAndTenantId(UUID id, UUID tenantId);

    List<PetProduct> findAllByTenantIdAndIdIn(UUID tenantId, Collection<UUID> ids);

    Optional<PetProduct> findByInventoryItemIdAndTenantId(UUID inventoryItemId, UUID tenantId);

    List<PetProduct> findAllByTenantIdAndInventoryItemIdIn(UUID tenantId, Collection<UUID> inventoryItemIds);

    @Query(value = """
            SELECT *
            FROM pet_products p
            WHERE p.id = :id
              AND p.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetProduct> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

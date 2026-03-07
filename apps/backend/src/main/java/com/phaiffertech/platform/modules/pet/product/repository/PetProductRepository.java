package com.phaiffertech.platform.modules.pet.product.repository;

import com.phaiffertech.platform.modules.pet.product.domain.PetProduct;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetProductRepository extends JpaRepository<PetProduct, UUID>, BaseTenantCrudRepository<PetProduct> {

    long countByTenantIdAndStockQuantityLessThanEqual(UUID tenantId, int stockQuantityThreshold);

    @Query("""
            SELECT p
            FROM PetProduct p
            WHERE p.tenantId = :tenantId
              AND (:search IS NULL OR
                   LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetProduct> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    boolean existsBySkuAndTenantId(String sku, UUID tenantId);

    boolean existsBySkuAndTenantIdAndIdNot(String sku, UUID tenantId, UUID id);

    Optional<PetProduct> findByIdAndTenantId(UUID id, UUID tenantId);

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

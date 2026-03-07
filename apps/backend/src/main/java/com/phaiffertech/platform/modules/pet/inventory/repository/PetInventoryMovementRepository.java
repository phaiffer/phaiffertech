package com.phaiffertech.platform.modules.pet.inventory.repository;

import com.phaiffertech.platform.modules.pet.inventory.domain.PetInventoryMovement;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetInventoryMovementRepository
        extends JpaRepository<PetInventoryMovement, UUID>, BaseTenantCrudRepository<PetInventoryMovement> {

    @Query("""
            SELECT i
            FROM PetInventoryMovement i
            WHERE i.tenantId = :tenantId
              AND (:productId IS NULL OR i.productId = :productId)
              AND (:movementType IS NULL OR UPPER(i.movementType) = UPPER(:movementType))
              AND (:search IS NULL OR
                   LOWER(i.movementType) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(i.notes, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetInventoryMovement> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("productId") UUID productId,
            @Param("movementType") String movementType,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetInventoryMovement> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_inventory_movements i
            WHERE i.id = :id
              AND i.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetInventoryMovement> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

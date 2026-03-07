package com.phaiffertech.platform.modules.pet.servicecatalog.repository;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetServiceCatalogRepository
        extends JpaRepository<PetServiceCatalog, UUID>, BaseTenantCrudRepository<PetServiceCatalog> {

    @Query("""
            SELECT s
            FROM PetServiceCatalog s
            WHERE s.tenantId = :tenantId
              AND (:search IS NULL OR
                   LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(s.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetServiceCatalog> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetServiceCatalog> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_services s
            WHERE s.id = :id
              AND s.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetServiceCatalog> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

package com.phaiffertech.platform.modules.pet.servicecatalog.repository;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCategory;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetServiceCatalogRepository
        extends JpaRepository<PetServiceCatalog, UUID>, BaseTenantCrudRepository<PetServiceCatalog> {

    long countByTenantId(UUID tenantId);

    @Query("""
            SELECT s
            FROM PetServiceCatalog s
            WHERE s.tenantId = :tenantId
              AND s.category IN :allowedCategories
              AND (:category IS NULL OR s.category = :category)
              AND (:active IS NULL OR s.active = :active)
              AND (:search = '%' OR
                   LOWER(s.name) LIKE :search OR
                   LOWER(COALESCE(s.description, '')) LIKE :search)
            """)
    Page<PetServiceCatalog> findAllByTenantIdAndFilters(
            @Param("tenantId") UUID tenantId,
            @Param("allowedCategories") Collection<PetServiceCategory> allowedCategories,
            @Param("category") PetServiceCategory category,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable
    );

    java.util.List<PetServiceCatalog> findAllByTenantIdAndIdIn(UUID tenantId, Collection<UUID> ids);

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

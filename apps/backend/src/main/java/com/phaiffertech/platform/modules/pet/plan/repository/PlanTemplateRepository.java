package com.phaiffertech.platform.modules.pet.plan.repository;

import com.phaiffertech.platform.modules.pet.plan.domain.PlanTemplate;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlanTemplateRepository extends JpaRepository<PlanTemplate, UUID>, BaseTenantCrudRepository<PlanTemplate> {

    Optional<PlanTemplate> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("""
            SELECT t FROM PlanTemplate t
            WHERE t.tenantId = :tenantId
              AND (:active IS NULL OR t.active = :active)
              AND (:search = '%' OR
                   LOWER(t.commercialName) LIKE :search OR
                   LOWER(COALESCE(t.description, '')) LIKE :search OR
                   LOWER(COALESCE(t.renewalRules, '')) LIKE :search)
              AND t.deletedAt IS NULL
            ORDER BY t.createdAt DESC
            """)
    Page<PlanTemplate> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable
    );
}

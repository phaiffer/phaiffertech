package com.phaiffertech.platform.modules.pet.plan.repository;

import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientPlanRepository
        extends JpaRepository<ClientPlan, UUID>, BaseTenantCrudRepository<ClientPlan> {

    Optional<ClientPlan> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("""
            SELECT p FROM ClientPlan p
            WHERE p.tenantId = :tenantId
              AND p.deletedAt IS NULL
            ORDER BY p.createdAt DESC
            """)
    Page<ClientPlan> findAllByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);
}
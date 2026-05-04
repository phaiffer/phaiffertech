package com.phaiffertech.platform.modules.pet.plan.repository;

import com.phaiffertech.platform.modules.pet.plan.domain.PlanTemplateService;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlanTemplateServiceRepository extends JpaRepository<PlanTemplateService, UUID> {

    List<PlanTemplateService> findAllByTenantIdAndPlanTemplateId(UUID tenantId, UUID planTemplateId);

    List<PlanTemplateService> findAllByTenantIdAndPlanTemplateIdIn(UUID tenantId, Collection<UUID> planTemplateIds);

    @Modifying
    @Query("""
            UPDATE PlanTemplateService s
            SET s.deletedAt = CURRENT_TIMESTAMP
            WHERE s.tenantId = :tenantId
              AND s.planTemplateId = :planTemplateId
              AND s.deletedAt IS NULL
            """)
    void softDeleteByTenantIdAndPlanTemplateId(
            @Param("tenantId") UUID tenantId,
            @Param("planTemplateId") UUID planTemplateId
    );
}

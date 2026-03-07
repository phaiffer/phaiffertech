package com.phaiffertech.platform.modules.crm.pipeline.repository;

import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipeline;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmPipelineRepository extends JpaRepository<CrmPipeline, UUID> {

    List<CrmPipeline> findAllByTenantIdOrderByCreatedAtAsc(UUID tenantId);

    Optional<CrmPipeline> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<CrmPipeline> findFirstByTenantIdAndDefaultPipelineTrueOrderByCreatedAtAsc(UUID tenantId);

    @Modifying
    @Query("""
            UPDATE CrmPipeline p
            SET p.defaultPipeline = false
            WHERE p.tenantId = :tenantId
            """)
    void clearDefaultByTenantId(@Param("tenantId") UUID tenantId);
}

package com.phaiffertech.platform.modules.crm.pipeline.repository;

import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipelineStage;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmPipelineStageRepository extends JpaRepository<CrmPipelineStage, UUID> {

    @Query("""
            SELECT s
            FROM CrmPipelineStage s
            WHERE s.tenantId = :tenantId
              AND (:search IS NULL OR
                   LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(s.code, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmPipelineStage> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    java.util.List<CrmPipelineStage> findAllByTenantIdOrderByPositionAsc(UUID tenantId);

    java.util.Optional<CrmPipelineStage> findByIdAndTenantId(UUID id, UUID tenantId);

    java.util.Optional<CrmPipelineStage> findFirstByTenantIdOrderByPositionAsc(UUID tenantId);

    boolean existsByTenantIdAndPosition(UUID tenantId, int position);

    boolean existsByTenantIdAndPositionAndIdNot(UUID tenantId, int position, UUID id);

    boolean existsByTenantIdAndCodeIgnoreCase(UUID tenantId, String code);

    boolean existsByTenantIdAndCodeIgnoreCaseAndIdNot(UUID tenantId, String code, UUID id);

    @Modifying
    @Query("""
            UPDATE CrmPipelineStage s
            SET s.defaultStage = false
            WHERE s.tenantId = :tenantId
            """)
    void clearDefaultByTenantId(@Param("tenantId") UUID tenantId);

    @Modifying
    @Query("""
            UPDATE CrmPipelineStage s
            SET s.defaultStage = false
            WHERE s.tenantId = :tenantId
              AND s.id <> :stageId
            """)
    void clearDefaultByTenantIdExcept(@Param("tenantId") UUID tenantId, @Param("stageId") UUID stageId);
}

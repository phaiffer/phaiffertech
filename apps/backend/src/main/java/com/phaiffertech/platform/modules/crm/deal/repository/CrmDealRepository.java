package com.phaiffertech.platform.modules.crm.deal.repository;

import com.phaiffertech.platform.modules.crm.deal.domain.CrmDeal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmDealRepository extends JpaRepository<CrmDeal, UUID> {

    @Query("""
            SELECT d
            FROM CrmDeal d
            WHERE d.tenantId = :tenantId
              AND (:status IS NULL OR UPPER(d.status) = UPPER(:status))
              AND (:companyId IS NULL OR d.companyId = :companyId)
              AND (:pipelineStageId IS NULL OR d.pipelineStageId = :pipelineStageId)
              AND (:ownerUserId IS NULL OR d.ownerUserId = :ownerUserId)
              AND (:search IS NULL OR
                   LOWER(d.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(d.currency, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(d.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmDeal> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("companyId") UUID companyId,
            @Param("pipelineStageId") UUID pipelineStageId,
            @Param("ownerUserId") UUID ownerUserId,
            @Param("search") String search,
            Pageable pageable
    );

    java.util.Optional<CrmDeal> findByIdAndTenantId(UUID id, UUID tenantId);
}

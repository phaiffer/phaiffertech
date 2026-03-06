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
              AND (:search IS NULL OR
                   LOWER(d.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(d.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmDeal> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    java.util.Optional<CrmDeal> findByIdAndTenantId(UUID id, UUID tenantId);
}

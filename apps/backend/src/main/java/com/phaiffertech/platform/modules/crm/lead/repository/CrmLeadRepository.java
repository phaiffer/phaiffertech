package com.phaiffertech.platform.modules.crm.lead.repository;

import com.phaiffertech.platform.modules.crm.lead.domain.CrmLead;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmLeadRepository extends JpaRepository<CrmLead, UUID>, BaseTenantCrudRepository<CrmLead> {

    @Query("""
            SELECT l
            FROM CrmLead l
            WHERE l.tenantId = :tenantId
              AND (:status IS NULL OR UPPER(l.status) = UPPER(:status))
              AND (:source IS NULL OR UPPER(COALESCE(l.source, '')) = UPPER(:source))
              AND (:companyId IS NULL OR l.companyId = :companyId)
              AND (:contactId IS NULL OR l.contactId = :contactId)
              AND (:assignedUserId IS NULL OR l.assignedUserId = :assignedUserId)
              AND (:search IS NULL OR
                   LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(l.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(l.phone, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(l.source, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(l.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmLead> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("source") String source,
            @Param("companyId") UUID companyId,
            @Param("contactId") UUID contactId,
            @Param("assignedUserId") UUID assignedUserId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<CrmLead> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM crm_leads l
            WHERE l.id = :id
              AND l.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<CrmLead> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

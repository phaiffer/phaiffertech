package com.phaiffertech.platform.modules.crm.task.repository;

import com.phaiffertech.platform.modules.crm.task.domain.CrmTask;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmTaskRepository extends JpaRepository<CrmTask, UUID> {

    @Query("""
            SELECT t
            FROM CrmTask t
            WHERE t.tenantId = :tenantId
              AND (:status IS NULL OR UPPER(t.status) = UPPER(:status))
              AND (:priority IS NULL OR UPPER(t.priority) = UPPER(:priority))
              AND (:assignedUserId IS NULL OR t.assignedUserId = :assignedUserId)
              AND (:companyId IS NULL OR t.companyId = :companyId)
              AND (:contactId IS NULL OR t.contactId = :contactId)
              AND (:leadId IS NULL OR t.leadId = :leadId)
              AND (:dealId IS NULL OR t.dealId = :dealId)
              AND (:search IS NULL OR
                   LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(t.priority, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(t.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmTask> findAllByTenantAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("assignedUserId") UUID assignedUserId,
            @Param("companyId") UUID companyId,
            @Param("contactId") UUID contactId,
            @Param("leadId") UUID leadId,
            @Param("dealId") UUID dealId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<CrmTask> findByIdAndTenantId(UUID id, UUID tenantId);
}

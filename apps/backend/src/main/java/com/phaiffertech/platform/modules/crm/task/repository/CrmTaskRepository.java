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
              AND (:status IS NULL OR t.status = :status)
              AND (:priority IS NULL OR t.priority = :priority)
              AND (:assignedUserId IS NULL OR t.assignedUserId = :assignedUserId)
              AND (:relatedReferenceType IS NULL OR t.relatedType = :relatedReferenceType)
              AND (:relatedId IS NULL OR t.relatedId = :relatedId)
              AND (:companyId IS NULL OR t.companyId = :companyId)
              AND (:contactId IS NULL OR t.contactId = :contactId)
              AND (:leadId IS NULL OR t.leadId = :leadId)
              AND (:dealId IS NULL OR t.dealId = :dealId)
              AND (:search = '%' OR
                   LOWER(t.title) LIKE :search OR
                   LOWER(COALESCE(t.description, '')) LIKE :search OR
                   LOWER(COALESCE(t.priority, '')) LIKE :search OR
                   LOWER(COALESCE(t.status, '')) LIKE :search)
            """)
    Page<CrmTask> findAllByTenantAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("assignedUserId") UUID assignedUserId,
            @Param("relatedReferenceType") String relatedReferenceType,
            @Param("relatedId") UUID relatedId,
            @Param("companyId") UUID companyId,
            @Param("contactId") UUID contactId,
            @Param("leadId") UUID leadId,
            @Param("dealId") UUID dealId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<CrmTask> findByIdAndTenantId(UUID id, UUID tenantId);
}

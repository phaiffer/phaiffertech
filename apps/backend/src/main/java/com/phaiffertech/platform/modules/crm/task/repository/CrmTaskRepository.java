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
              AND (:search IS NULL OR
                   LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(t.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmTask> findAllByTenantAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<CrmTask> findByIdAndTenantId(UUID id, UUID tenantId);
}

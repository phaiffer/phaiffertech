package com.phaiffertech.platform.modules.crm.activity.repository;

import com.phaiffertech.platform.core.audit.domain.AuditLog;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmActivityRepository extends JpaRepository<AuditLog, UUID> {

    @Query("""
            SELECT a
            FROM AuditLog a
            WHERE a.tenantId = :tenantId
              AND (
                  (a.entity = 'crm_contact' AND a.action = 'CREATE') OR
                  (a.entity = 'crm_lead' AND a.action = 'CREATE') OR
                  (a.entity = 'crm_deal' AND a.action = 'UPDATE') OR
                  (a.entity = 'crm_task' AND a.action = 'CREATE') OR
                  (a.entity = 'crm_note' AND a.action = 'CREATE')
              )
            """)
    Page<AuditLog> findCrmActivity(@Param("tenantId") UUID tenantId, Pageable pageable);
}

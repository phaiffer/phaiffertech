package com.phaiffertech.platform.modules.crm.note.repository;

import com.phaiffertech.platform.modules.crm.note.domain.CrmNote;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmNoteRepository extends JpaRepository<CrmNote, UUID> {

    @Query("""
            SELECT n
            FROM CrmNote n
            WHERE n.tenantId = :tenantId
              AND (:companyId IS NULL OR n.companyId = :companyId)
              AND (:contactId IS NULL OR n.contactId = :contactId)
              AND (:leadId IS NULL OR n.leadId = :leadId)
              AND (:dealId IS NULL OR n.dealId = :dealId)
              AND (:search IS NULL OR LOWER(n.content) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmNote> findAllByTenantAndRelation(
            @Param("tenantId") UUID tenantId,
            @Param("companyId") UUID companyId,
            @Param("contactId") UUID contactId,
            @Param("leadId") UUID leadId,
            @Param("dealId") UUID dealId,
            @Param("search") String search,
            Pageable pageable
    );

    java.util.Optional<CrmNote> findByIdAndTenantId(UUID id, UUID tenantId);
}

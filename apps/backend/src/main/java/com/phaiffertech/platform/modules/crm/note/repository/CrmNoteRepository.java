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
              AND (:relatedType IS NULL OR UPPER(n.relatedType) = UPPER(:relatedType))
              AND (:relatedId IS NULL OR n.relatedId = :relatedId)
            """)
    Page<CrmNote> findAllByTenantAndRelation(
            @Param("tenantId") UUID tenantId,
            @Param("relatedType") String relatedType,
            @Param("relatedId") UUID relatedId,
            Pageable pageable
    );
}

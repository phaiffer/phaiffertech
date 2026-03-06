package com.phaiffertech.platform.modules.crm.contact.repository;

import com.phaiffertech.platform.modules.crm.contact.domain.CrmContact;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmContactRepository extends JpaRepository<CrmContact, UUID> {

    @Query("""
            SELECT c
            FROM CrmContact c
            WHERE c.tenantId = :tenantId
              AND (:search IS NULL OR
                   LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.lastName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.company, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.status, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmContact> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<CrmContact> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM crm_contacts c
            WHERE c.id = :id
              AND c.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<CrmContact> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

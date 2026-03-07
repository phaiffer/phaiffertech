package com.phaiffertech.platform.modules.crm.company.repository;

import com.phaiffertech.platform.modules.crm.company.domain.CrmCompany;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmCompanyRepository extends JpaRepository<CrmCompany, UUID>, BaseTenantCrudRepository<CrmCompany> {

    @Query("""
            SELECT c
            FROM CrmCompany c
            WHERE c.tenantId = :tenantId
              AND (:status IS NULL OR UPPER(c.status) = UPPER(:status))
              AND (:ownerUserId IS NULL OR c.ownerUserId = :ownerUserId)
              AND (:search IS NULL OR
                   LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.legalName, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.document, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.website, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(COALESCE(c.industry, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<CrmCompany> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("ownerUserId") UUID ownerUserId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<CrmCompany> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM crm_companies c
            WHERE c.id = :id
              AND c.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<CrmCompany> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );

    boolean existsByTenantIdAndEmailIgnoreCaseAndDeletedAtIsNull(UUID tenantId, String email);

    boolean existsByTenantIdAndEmailIgnoreCaseAndIdNotAndDeletedAtIsNull(UUID tenantId, String email, UUID id);

    boolean existsByTenantIdAndDocumentIgnoreCaseAndDeletedAtIsNull(UUID tenantId, String document);

    boolean existsByTenantIdAndDocumentIgnoreCaseAndIdNotAndDeletedAtIsNull(UUID tenantId, String document, UUID id);
}

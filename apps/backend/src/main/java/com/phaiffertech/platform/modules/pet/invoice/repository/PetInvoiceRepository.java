package com.phaiffertech.platform.modules.pet.invoice.repository;

import com.phaiffertech.platform.modules.pet.invoice.domain.PetInvoice;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetInvoiceRepository extends JpaRepository<PetInvoice, UUID>, BaseTenantCrudRepository<PetInvoice> {

    long countByTenantIdAndDeletedAtIsNull(UUID tenantId);

    @Query("""
            SELECT i
            FROM PetInvoice i
            WHERE i.tenantId = :tenantId
              AND (:clientId IS NULL OR i.clientId = :clientId)
              AND (:status IS NULL OR UPPER(i.status) = UPPER(:status))
              AND (:search IS NULL OR LOWER(i.status) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<PetInvoice> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("clientId") UUID clientId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetInvoice> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM pet_invoices i
            WHERE i.id = :id
              AND i.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PetInvoice> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

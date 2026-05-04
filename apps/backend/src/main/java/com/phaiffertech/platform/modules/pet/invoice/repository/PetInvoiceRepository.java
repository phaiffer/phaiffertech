package com.phaiffertech.platform.modules.pet.invoice.repository;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.modules.pet.invoice.domain.PetInvoice;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Collection;
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
            JOIN i.financeInvoice f
            WHERE i.tenantId = :tenantId
              AND (:clientId IS NULL OR i.clientId = :clientId)
              AND (:status IS NULL OR f.status = :status)
              AND (:search = '%' OR
                   LOWER(COALESCE(f.counterpartyName, '')) LIKE :search OR
                   LOWER(COALESCE(f.description, '')) LIKE :search OR
                   LOWER(COALESCE(f.businessContextLabel, '')) LIKE :search OR
                   LOWER(COALESCE(f.documentNumber, '')) LIKE :search)
            ORDER BY COALESCE(f.issuedAt, f.createdAt) DESC
            """)
    Page<PetInvoice> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("clientId") UUID clientId,
            @Param("status") FinanceInvoiceStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<PetInvoice> findByIdAndTenantId(UUID id, UUID tenantId);

    java.util.List<PetInvoice> findAllByTenantIdAndFinanceInvoiceIdIn(UUID tenantId, Collection<UUID> financeInvoiceIds);

    @Query("""
            SELECT i
            FROM PetInvoice i
            JOIN i.financeInvoice f
            WHERE i.tenantId = :tenantId
              AND f.businessContextType = :businessContextType
              AND f.businessContextId = :businessContextId
              AND f.status <> :excludedStatus
            ORDER BY COALESCE(f.issuedAt, f.createdAt) DESC
            """)
    java.util.List<PetInvoice> findAllByBusinessContextExcludingStatus(
            @Param("tenantId") UUID tenantId,
            @Param("businessContextType") String businessContextType,
            @Param("businessContextId") UUID businessContextId,
            @Param("excludedStatus") FinanceInvoiceStatus excludedStatus
    );

    @Query("""
            SELECT COUNT(i)
            FROM PetInvoice i
            JOIN i.financeInvoice f
            WHERE i.tenantId = :tenantId
              AND i.clientId = :clientId
              AND LOWER(f.description) LIKE :periodPattern
            """)
    long countByClientAndPeriodDescription(
            @Param("tenantId") UUID tenantId,
            @Param("clientId") UUID clientId,
            @Param("periodPattern") String periodPattern
    );

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

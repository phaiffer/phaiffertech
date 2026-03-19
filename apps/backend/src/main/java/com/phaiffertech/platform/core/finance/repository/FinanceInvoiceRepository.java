package com.phaiffertech.platform.core.finance.repository;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoice;
import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.core.finance.domain.FinanceSourceModule;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface FinanceInvoiceRepository extends JpaRepository<FinanceInvoice, UUID>, BaseTenantCrudRepository<FinanceInvoice> {

    @Query("""
            SELECT i
            FROM FinanceInvoice i
            WHERE i.tenantId = :tenantId
              AND (:sourceModule IS NULL OR i.sourceModule = :sourceModule)
              AND (:status IS NULL OR i.status = :status)
              AND (:businessContextType IS NULL OR i.businessContextType = :businessContextType)
              AND (:businessContextId IS NULL OR i.businessContextId = :businessContextId)
              AND (:search = '%' OR
                   LOWER(i.counterpartyName) LIKE :search OR
                   LOWER(COALESCE(i.description, '')) LIKE :search OR
                   LOWER(COALESCE(i.businessContextLabel, '')) LIKE :search OR
                   LOWER(COALESCE(i.fiscalReference, '')) LIKE :search OR
                   LOWER(COALESCE(i.documentNumber, '')) LIKE :search)
            """)
    Page<FinanceInvoice> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("sourceModule") FinanceSourceModule sourceModule,
            @Param("status") FinanceInvoiceStatus status,
            @Param("businessContextType") String businessContextType,
            @Param("businessContextId") UUID businessContextId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<FinanceInvoice> findByIdAndTenantId(UUID id, UUID tenantId);

    List<FinanceInvoice> findAllByTenantIdAndIdIn(UUID tenantId, Collection<UUID> ids);

    @Query(value = """
            SELECT *
            FROM finance_invoices i
            WHERE i.id = :id
              AND i.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<FinanceInvoice> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT i
            FROM FinanceInvoice i
            WHERE i.id = :id
              AND i.tenantId = :tenantId
            """)
    Optional<FinanceInvoice> findLockedByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    long countByTenantIdAndSourceModuleAndStatusIn(UUID tenantId, FinanceSourceModule sourceModule, Collection<FinanceInvoiceStatus> statuses);
}

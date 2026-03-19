package com.phaiffertech.platform.core.finance.repository;

import com.phaiffertech.platform.core.finance.domain.FinancePayment;
import com.phaiffertech.platform.core.finance.domain.FinancePaymentStatus;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancePaymentRepository extends JpaRepository<FinancePayment, UUID>, BaseTenantCrudRepository<FinancePayment> {

    @Query("""
            SELECT p
            FROM FinancePayment p
            WHERE p.tenantId = :tenantId
              AND (:invoiceId IS NULL OR p.invoiceId = :invoiceId)
              AND (:status IS NULL OR p.status = :status)
              AND (:search = '%' OR
                   LOWER(COALESCE(p.referenceCode, '')) LIKE :search OR
                   LOWER(COALESCE(p.notes, '')) LIKE :search)
            """)
    Page<FinancePayment> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("invoiceId") UUID invoiceId,
            @Param("status") FinancePaymentStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<FinancePayment> findByIdAndTenantId(UUID id, UUID tenantId);

    List<FinancePayment> findAllByTenantIdAndInvoiceIdInOrderByReceivedAtDesc(UUID tenantId, Collection<UUID> invoiceIds);

    @Query(value = """
            SELECT *
            FROM finance_payments p
            WHERE p.id = :id
              AND p.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<FinancePayment> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );

    @Query("""
            SELECT COALESCE(SUM(p.amount), 0)
            FROM FinancePayment p
            WHERE p.tenantId = :tenantId
              AND p.invoiceId = :invoiceId
              AND p.status = com.phaiffertech.platform.core.finance.domain.FinancePaymentStatus.CONFIRMED
            """)
    BigDecimal sumConfirmedAmountByInvoiceId(
            @Param("tenantId") UUID tenantId,
            @Param("invoiceId") UUID invoiceId
    );

    @Query("""
            SELECT MAX(p.receivedAt)
            FROM FinancePayment p
            WHERE p.tenantId = :tenantId
              AND p.invoiceId = :invoiceId
              AND p.status = com.phaiffertech.platform.core.finance.domain.FinancePaymentStatus.CONFIRMED
            """)
    java.time.Instant findLatestConfirmedReceivedAt(
            @Param("tenantId") UUID tenantId,
            @Param("invoiceId") UUID invoiceId
    );

    boolean existsByTenantIdAndInvoiceId(UUID tenantId, UUID invoiceId);
}

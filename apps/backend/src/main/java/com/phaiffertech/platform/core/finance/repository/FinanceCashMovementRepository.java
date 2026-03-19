package com.phaiffertech.platform.core.finance.repository;

import com.phaiffertech.platform.core.finance.domain.FinanceCashMovement;
import com.phaiffertech.platform.core.finance.domain.FinanceCashCategory;
import com.phaiffertech.platform.core.finance.domain.FinanceCashDirection;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinanceCashMovementRepository
        extends JpaRepository<FinanceCashMovement, UUID>, BaseTenantCrudRepository<FinanceCashMovement> {

    @Query("""
            SELECT c
            FROM FinanceCashMovement c
            WHERE c.tenantId = :tenantId
              AND (:invoiceId IS NULL OR c.invoiceId = :invoiceId)
              AND (:paymentId IS NULL OR c.paymentId = :paymentId)
              AND (:direction IS NULL OR c.direction = :direction)
              AND (:category IS NULL OR c.category = :category)
              AND (:search = '%' OR
                   LOWER(c.description) LIKE :search)
            """)
    Page<FinanceCashMovement> findAllByTenantIdAndSearch(
            @Param("tenantId") UUID tenantId,
            @Param("invoiceId") UUID invoiceId,
            @Param("paymentId") UUID paymentId,
            @Param("direction") FinanceCashDirection direction,
            @Param("category") FinanceCashCategory category,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<FinanceCashMovement> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
            SELECT *
            FROM finance_cash_movements c
            WHERE c.id = :id
              AND c.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<FinanceCashMovement> findByIdIncludingDeleted(
            @Param("id") UUID id,
            @Param("tenantId") UUID tenantId
    );
}

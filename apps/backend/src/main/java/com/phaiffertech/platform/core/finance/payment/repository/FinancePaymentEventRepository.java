package com.phaiffertech.platform.core.finance.payment.repository;

import com.phaiffertech.platform.core.finance.payment.domain.FinancePaymentEvent;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancePaymentEventRepository extends JpaRepository<FinancePaymentEvent, UUID> {

    List<FinancePaymentEvent> findAllByTenantIdAndInvoiceIdOrderByOccurredAtDescCreatedAtDesc(
            UUID tenantId,
            UUID invoiceId
    );

    Optional<FinancePaymentEvent> findByTenantIdAndProviderAndIdempotencyKeyAndDeletedAtIsNull(
            UUID tenantId,
            PaymentProviderType provider,
            String idempotencyKey
    );
}

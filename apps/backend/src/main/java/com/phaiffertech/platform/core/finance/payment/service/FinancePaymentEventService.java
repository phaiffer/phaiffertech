package com.phaiffertech.platform.core.finance.payment.service;

import com.phaiffertech.platform.core.finance.payment.domain.FinancePaymentEvent;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentEventStatus;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentEventType;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;
import com.phaiffertech.platform.core.finance.payment.dto.FinancePaymentEventResponse;
import com.phaiffertech.platform.core.finance.payment.repository.FinancePaymentEventRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancePaymentEventService {

    private final FinancePaymentEventRepository repository;

    public FinancePaymentEventService(FinancePaymentEventRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public FinancePaymentEvent recordEvent(UUID tenantId, FinancePaymentEventRecordCommand command) {
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant id is required to record a payment event.");
        }
        if (command.invoiceId() == null) {
            throw new IllegalArgumentException("Invoice id is required to record a payment event.");
        }
        if (command.eventType() == null) {
            throw new IllegalArgumentException("Payment event type is required.");
        }

        PaymentProviderType provider = command.provider() == null ? PaymentProviderType.MANUAL : command.provider();
        String normalizedIdempotencyKey = normalizeOptionalText(command.idempotencyKey());

        if (normalizedIdempotencyKey != null) {
            Optional<FinancePaymentEvent> existing = repository
                    .findByTenantIdAndProviderAndIdempotencyKeyAndDeletedAtIsNull(
                            tenantId,
                            provider,
                            normalizedIdempotencyKey
                    );
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        FinancePaymentEvent event = new FinancePaymentEvent();
        event.setTenantId(tenantId);
        event.setInvoiceId(command.invoiceId());
        event.setFinancePaymentId(command.financePaymentId());
        event.setProvider(provider);
        event.setEventType(command.eventType());
        event.setEventStatus(command.eventStatus() == null ? PaymentEventStatus.RECORDED : command.eventStatus());
        event.setIdempotencyKey(normalizedIdempotencyKey);
        event.setOccurredAt(command.occurredAt() == null ? Instant.now() : command.occurredAt());
        event.setSummary(normalizeSummary(command.summary(), command.eventType()));

        return repository.save(event);
    }

    @Transactional(readOnly = true)
    public List<FinancePaymentEventResponse> listByInvoice(UUID tenantId, UUID invoiceId) {
        return repository.findAllByTenantIdAndInvoiceIdOrderByOccurredAtDescCreatedAtDesc(tenantId, invoiceId)
                .stream()
                .map(FinancePaymentEventResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FinancePaymentEventResponse> listCurrentTenantByInvoice(UUID invoiceId) {
        return listByInvoice(TenantContext.getRequiredTenantId(), invoiceId);
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeSummary(String summary, PaymentEventType eventType) {
        String normalized = normalizeOptionalText(summary);
        if (normalized == null) {
            return "Payment lifecycle event: " + eventType.name();
        }
        return normalized.length() <= 255 ? normalized : normalized.substring(0, 255);
    }
}

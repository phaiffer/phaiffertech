package com.phaiffertech.platform.core.finance.payment.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "finance_payment_events")
@SQLDelete(sql = "UPDATE finance_payment_events SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class FinancePaymentEvent extends BaseTenantEntity {

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "finance_payment_id")
    private UUID financePaymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 40)
    private PaymentProviderType provider = PaymentProviderType.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 60)
    private PaymentEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_status", nullable = false, length = 30)
    private PaymentEventStatus eventStatus = PaymentEventStatus.RECORDED;

    @Column(name = "idempotency_key", length = 160)
    private String idempotencyKey;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt = Instant.now();

    @Column(name = "summary", nullable = false, length = 255)
    private String summary;

    public UUID getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(UUID invoiceId) {
        this.invoiceId = invoiceId;
    }

    public UUID getFinancePaymentId() {
        return financePaymentId;
    }

    public void setFinancePaymentId(UUID financePaymentId) {
        this.financePaymentId = financePaymentId;
    }

    public PaymentProviderType getProvider() {
        return provider;
    }

    public void setProvider(PaymentProviderType provider) {
        this.provider = provider;
    }

    public PaymentEventType getEventType() {
        return eventType;
    }

    public void setEventType(PaymentEventType eventType) {
        this.eventType = eventType;
    }

    public PaymentEventStatus getEventStatus() {
        return eventStatus;
    }

    public void setEventStatus(PaymentEventStatus eventStatus) {
        this.eventStatus = eventStatus;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}

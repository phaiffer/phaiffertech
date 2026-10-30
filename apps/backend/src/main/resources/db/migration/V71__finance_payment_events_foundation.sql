CREATE TABLE IF NOT EXISTS finance_payment_events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID NOT NULL REFERENCES finance_invoices(id),
    finance_payment_id UUID NULL REFERENCES finance_payments(id),
    provider VARCHAR(40) NOT NULL DEFAULT 'MANUAL',
    event_type VARCHAR(60) NOT NULL,
    event_status VARCHAR(30) NOT NULL DEFAULT 'RECORDED',
    idempotency_key VARCHAR(160) NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    summary VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    CONSTRAINT chk_finance_payment_events_provider CHECK (
        provider IN ('MANUAL', 'NOOP', 'ASAAS', 'MERCADO_PAGO', 'STRIPE', 'PAGARME')
    ),
    CONSTRAINT chk_finance_payment_events_type CHECK (
        event_type IN (
            'INVOICE_CREATED',
            'INVOICE_ISSUED',
            'INVOICE_CANCELED',
            'CHARGE_REQUESTED',
            'CHARGE_CREATED',
            'CHARGE_FAILED',
            'WEBHOOK_RECEIVED',
            'PAYMENT_RECORDED',
            'PAYMENT_CONFIRMED',
            'PAYMENT_CANCELED',
            'REFUND_RECORDED'
        )
    ),
    CONSTRAINT chk_finance_payment_events_status CHECK (
        event_status IN ('RECORDED', 'PROCESSED', 'IGNORED', 'FAILED')
    )
);

CREATE INDEX IF NOT EXISTS idx_finance_payment_events_tenant_invoice_occurred
    ON finance_payment_events (tenant_id, invoice_id, occurred_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_finance_payment_events_tenant_payment
    ON finance_payment_events (tenant_id, finance_payment_id)
    WHERE finance_payment_id IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_payment_events_tenant_provider_idempotency
    ON finance_payment_events (tenant_id, provider, idempotency_key)
    WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;

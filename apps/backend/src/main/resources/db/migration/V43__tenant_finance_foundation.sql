-- Shared tenant-scoped finance foundation with invoice, payment and cash control readiness.

CREATE TABLE finance_invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    source_module VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    counterparty_reference_type VARCHAR(60) NULL,
    counterparty_reference_id UUID NULL,
    counterparty_name VARCHAR(160) NOT NULL,
    business_context_type VARCHAR(60) NULL,
    business_context_id UUID NULL,
    business_context_label VARCHAR(180) NULL,
    description VARCHAR(255) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    issued_at TIMESTAMPTZ NULL,
    due_at TIMESTAMPTZ NULL,
    paid_at TIMESTAMPTZ NULL,
    canceled_at TIMESTAMPTZ NULL,
    document_series VARCHAR(20) NULL,
    document_number VARCHAR(60) NULL,
    fiscal_document_type VARCHAR(40) NULL,
    fiscal_status VARCHAR(40) NOT NULL DEFAULT 'NOT_REQUESTED',
    fiscal_reference VARCHAR(120) NULL,
    fiscal_payload_reference VARCHAR(120) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_finance_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT chk_finance_invoices_status CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELED')),
    CONSTRAINT chk_finance_invoices_total_amount_non_negative CHECK (total_amount >= 0.00),
    CONSTRAINT chk_finance_invoices_paid_amount_non_negative CHECK (paid_amount >= 0.00),
    CONSTRAINT chk_finance_invoices_paid_amount_range CHECK (paid_amount <= total_amount)
);

CREATE UNIQUE INDEX uq_finance_invoices_document_number
    ON finance_invoices (tenant_id, document_series, document_number)
    WHERE document_number IS NOT NULL;
CREATE INDEX idx_finance_invoices_status
    ON finance_invoices (tenant_id, status, issued_at DESC);
CREATE INDEX idx_finance_invoices_context
    ON finance_invoices (tenant_id, business_context_type, business_context_id);
CREATE INDEX idx_finance_invoices_source_module
    ON finance_invoices (tenant_id, source_module, issued_at DESC);

CREATE TABLE finance_payments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'CONFIRMED',
    method VARCHAR(40) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_code VARCHAR(120) NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_finance_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_finance_payments_invoice FOREIGN KEY (invoice_id) REFERENCES finance_invoices (id),
    CONSTRAINT chk_finance_payments_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELED')),
    CONSTRAINT chk_finance_payments_amount_positive CHECK (amount > 0.00)
);

CREATE INDEX idx_finance_payments_invoice
    ON finance_payments (tenant_id, invoice_id, received_at DESC);
CREATE INDEX idx_finance_payments_status
    ON finance_payments (tenant_id, status, received_at DESC);

CREATE TABLE finance_cash_movements (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    invoice_id UUID NULL,
    payment_id UUID NULL,
    direction VARCHAR(10) NOT NULL,
    category VARCHAR(40) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_finance_cash_movements_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_finance_cash_movements_invoice FOREIGN KEY (invoice_id) REFERENCES finance_invoices (id),
    CONSTRAINT fk_finance_cash_movements_payment FOREIGN KEY (payment_id) REFERENCES finance_payments (id),
    CONSTRAINT chk_finance_cash_movements_direction CHECK (direction IN ('IN', 'OUT')),
    CONSTRAINT chk_finance_cash_movements_amount_positive CHECK (amount > 0.00)
);

CREATE INDEX idx_finance_cash_movements_invoice
    ON finance_cash_movements (tenant_id, invoice_id, occurred_at DESC);
CREATE INDEX idx_finance_cash_movements_payment
    ON finance_cash_movements (tenant_id, payment_id, occurred_at DESC);
CREATE INDEX idx_finance_cash_movements_category
    ON finance_cash_movements (tenant_id, category, occurred_at DESC);

INSERT INTO finance_invoices (
    id,
    tenant_id,
    source_module,
    counterparty_reference_type,
    counterparty_reference_id,
    counterparty_name,
    business_context_type,
    business_context_id,
    business_context_label,
    description,
    status,
    currency,
    total_amount,
    paid_amount,
    issued_at,
    due_at,
    paid_at,
    canceled_at,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at
)
SELECT
    i.id,
    i.tenant_id,
    'PET',
    'PET.CLIENT',
    i.client_id,
    COALESCE(NULLIF(BTRIM(c.name), ''), NULLIF(BTRIM(c.full_name), ''), 'Pet client'),
    NULL,
    NULL,
    NULL,
    'Migrated from legacy Pet invoice.',
    CASE
        WHEN UPPER(i.status) = 'PAID' THEN 'PAID'
        WHEN UPPER(i.status) = 'CANCELED' THEN 'CANCELED'
        ELSE 'ISSUED'
    END,
    'BRL',
    i.total_amount,
    CASE
        WHEN UPPER(i.status) = 'PAID' THEN i.total_amount
        ELSE 0.00
    END,
    i.issued_at,
    i.issued_at,
    CASE
        WHEN UPPER(i.status) = 'PAID' THEN i.issued_at
        ELSE NULL
    END,
    CASE
        WHEN UPPER(i.status) = 'CANCELED' THEN i.updated_at
        ELSE NULL
    END,
    i.created_at,
    i.updated_at,
    i.created_by,
    i.updated_by,
    i.deleted_at
FROM pet_invoices i
JOIN pet_clients c ON c.id = i.client_id
WHERE NOT EXISTS (
    SELECT 1
    FROM finance_invoices fi
    WHERE fi.id = i.id
);

WITH inserted_payments AS (
    INSERT INTO finance_payments (
        id,
        tenant_id,
        invoice_id,
        status,
        method,
        amount,
        received_at,
        reference_code,
        notes,
        created_at,
        updated_at,
        created_by,
        updated_by,
        deleted_at
    )
    SELECT
        gen_random_uuid(),
        i.tenant_id,
        i.id,
        'CONFIRMED',
        'MANUAL',
        i.total_amount,
        i.issued_at,
        NULL,
        'Legacy paid Pet invoice migrated into finance payments.',
        i.created_at,
        i.updated_at,
        i.created_by,
        i.updated_by,
        i.deleted_at
    FROM pet_invoices i
    WHERE UPPER(i.status) = 'PAID'
      AND i.deleted_at IS NULL
    RETURNING id, tenant_id, invoice_id, amount, received_at, created_at, updated_at, created_by, updated_by
)
INSERT INTO finance_cash_movements (
    id,
    tenant_id,
    invoice_id,
    payment_id,
    direction,
    category,
    amount,
    currency,
    occurred_at,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at
)
SELECT
    gen_random_uuid(),
    p.tenant_id,
    p.invoice_id,
    p.id,
    'IN',
    'INVOICE_PAYMENT',
    p.amount,
    'BRL',
    p.received_at,
    'Legacy invoice payment migrated into cash ledger.',
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by,
    NULL
FROM inserted_payments p;

DROP INDEX IF EXISTS idx_pet_invoices_client;
DROP INDEX IF EXISTS idx_pet_invoices_status;

ALTER TABLE pet_invoices
    ADD COLUMN finance_invoice_id UUID;

UPDATE pet_invoices
SET finance_invoice_id = id
WHERE finance_invoice_id IS NULL;

ALTER TABLE pet_invoices
    ALTER COLUMN finance_invoice_id SET NOT NULL,
    ADD CONSTRAINT fk_pet_invoices_finance_invoice FOREIGN KEY (finance_invoice_id) REFERENCES finance_invoices (id),
    DROP COLUMN total_amount,
    DROP COLUMN status,
    DROP COLUMN issued_at;

CREATE INDEX idx_pet_invoices_client ON pet_invoices (tenant_id, client_id);
CREATE UNIQUE INDEX uq_pet_invoices_finance_invoice ON pet_invoices (finance_invoice_id);

INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001348'::uuid AS id, 'finance.invoice.read' AS code, 'Read finance invoices' AS description
    UNION ALL SELECT '00000000-0000-0000-0000-000000001349'::uuid, 'finance.invoice.create', 'Create finance invoices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001350'::uuid, 'finance.invoice.update', 'Update finance invoices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001351'::uuid, 'finance.invoice.delete', 'Delete finance invoices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001352'::uuid, 'finance.payment.read', 'Read finance payments'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001353'::uuid, 'finance.payment.create', 'Create finance payments'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001354'::uuid, 'finance.payment.update', 'Update finance payments'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001355'::uuid, 'finance.payment.delete', 'Delete finance payments'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001356'::uuid, 'finance.cash.read', 'Read finance cash movements'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001357'::uuid, 'finance.cash.create', 'Create finance cash movements'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions p
    WHERE p.code = seed.code
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'finance.invoice.read',
    'finance.payment.read',
    'finance.cash.read'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'finance.invoice.create',
    'finance.invoice.update',
    'finance.payment.create',
    'finance.payment.update',
    'finance.cash.create'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'finance.invoice.delete',
    'finance.payment.delete'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

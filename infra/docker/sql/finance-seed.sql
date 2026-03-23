-- Optional Finance sample seed for local development.

INSERT INTO finance_invoices (
    id, tenant_id, source_module,
    counterparty_reference_type, counterparty_reference_id, counterparty_name,
    business_context_type, business_context_label,
    description, status, currency, total_amount, paid_amount,
    issued_at, due_at, fiscal_status,
    created_by, updated_by
)
SELECT
    'f1111111-0000-0000-0000-000000000001',
    t.id,
    'CRM',
    'CRM_CONTACT', '55555555-0000-0000-0000-000000000001', 'John Doe',
    'CRM_DEAL', 'Acme Platform Proposal',
    'Platform subscription – initial contract',
    'ISSUED', 'BRL', 8500.00, 0.00,
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days', 'NOT_REQUESTED',
    'seed', 'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM finance_invoices i
      WHERE i.id = 'f1111111-0000-0000-0000-000000000001'
  );

INSERT INTO finance_invoices (
    id, tenant_id, source_module,
    counterparty_reference_type, counterparty_reference_id, counterparty_name,
    business_context_type, business_context_label,
    description, status, currency, total_amount, paid_amount,
    issued_at, due_at, fiscal_status,
    created_by, updated_by
)
SELECT
    'f1111111-0000-0000-0000-000000000002',
    t.id,
    'CRM',
    'CRM_CONTACT', '55555555-0000-0000-0000-000000000002', 'Mary Smith',
    'CRM_DEAL', 'Beta Analytics Module',
    'Analytics module onboarding fee',
    'ISSUED', 'BRL', 3200.00, 0.00,
    NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'NOT_REQUESTED',
    'seed', 'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM finance_invoices i
      WHERE i.id = 'f1111111-0000-0000-0000-000000000002'
  );

INSERT INTO finance_invoices (
    id, tenant_id, source_module,
    counterparty_name, description,
    status, currency, total_amount, paid_amount,
    issued_at, due_at, paid_at, fiscal_status,
    created_by, updated_by
)
SELECT
    'f1111111-0000-0000-0000-000000000003',
    t.id,
    'MANUAL',
    'Phaiffer Labs', 'Annual support contract renewal',
    'PAID', 'BRL', 12000.00, 12000.00,
    NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days', 'NOT_REQUESTED',
    'seed', 'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM finance_invoices i
      WHERE i.id = 'f1111111-0000-0000-0000-000000000003'
  );

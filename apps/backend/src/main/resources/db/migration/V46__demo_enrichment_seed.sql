-- Phase 18: Demo enrichment seed
-- Adds representative finance, inventory, CRM and IoT records for demo tenants
-- so dashboards and operator surfaces show meaningful business states.
-- All inserts are idempotent (NOT EXISTS guards).

-- ─── Finance invoices ────────────────────────────────────────────────────────

-- Overdue invoice from CRM deal (John Doe / Seed Corp)
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
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM finance_invoices i
      WHERE i.id = 'f1111111-0000-0000-0000-000000000001'
  );

-- Pending invoice awaiting payment (Mary Smith / Phaiffer Labs)
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
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM finance_invoices i
      WHERE i.id = 'f1111111-0000-0000-0000-000000000002'
  );

-- Paid invoice – represents healthy cash flow in demo
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
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM finance_invoices i
      WHERE i.id = 'f1111111-0000-0000-0000-000000000003'
  );

-- PetFlow invoice pending payment
INSERT INTO finance_invoices (
    id, tenant_id, source_module,
    counterparty_name, description,
    status, currency, total_amount, paid_amount,
    issued_at, due_at, fiscal_status,
    created_by, updated_by
)
SELECT
    'f1111111-0000-0000-0000-000000000004',
    t.id,
    'PET',
    'Ana Martins', 'Vaccination – Thor (Labrador)',
    'ISSUED', 'BRL', 280.00, 0.00,
    NOW() - INTERVAL '3 days', NOW() + INTERVAL '7 days', 'NOT_REQUESTED',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM finance_invoices i
      WHERE i.id = 'f1111111-0000-0000-0000-000000000004'
  );

-- ─── Inventory items ─────────────────────────────────────────────────────────

-- Low-stock item (at or below minimum)
INSERT INTO inventory_items (
    id, tenant_id, name, sku, category, unit_of_measure,
    current_quantity, minimum_quantity, reorder_point,
    created_by, updated_by
)
SELECT
    'e1111111-0000-0000-0000-000000000001',
    t.id,
    'Vaccine Distemper 10ml', 'VAC-DIST-10ML', 'PET_VETERINARY_SUPPLY', 'UNIT',
    2, 5, 10,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM inventory_items i
      WHERE i.tenant_id = t.id AND i.sku = 'VAC-DIST-10ML'
  );

-- Adequate stock item (shows healthy state contrast)
INSERT INTO inventory_items (
    id, tenant_id, name, sku, category, unit_of_measure,
    current_quantity, minimum_quantity, reorder_point,
    created_by, updated_by
)
SELECT
    'e1111111-0000-0000-0000-000000000002',
    t.id,
    'Antiparasitic Collar L', 'COLLAR-AP-L', 'PET_RETAIL_GOOD', 'UNIT',
    24, 5, 12,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM inventory_items i
      WHERE i.tenant_id = t.id AND i.sku = 'COLLAR-AP-L'
  );

-- Second low-stock item (IoT part category)
INSERT INTO inventory_items (
    id, tenant_id, name, sku, category, unit_of_measure,
    current_quantity, minimum_quantity, reorder_point,
    created_by, updated_by
)
SELECT
    'e1111111-0000-0000-0000-000000000003',
    t.id,
    'Temperature Sensor Probe', 'IOT-PROBE-TEMP', 'IOT_SPARE_PART', 'UNIT',
    1, 3, 8,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM inventory_items i
      WHERE i.tenant_id = t.id AND i.sku = 'IOT-PROBE-TEMP'
  );

-- ─── CRM overdue tasks ───────────────────────────────────────────────────────

-- Overdue follow-up task linked to Acme lead
INSERT INTO crm_tasks (
    id, tenant_id, title, description,
    status, priority, due_date,
    related_type, related_id,
    created_by, updated_by
)
SELECT
    'd1111111-0000-0000-0000-000000000001',
    t.id,
    'Follow up on Acme contract signature',
    'Contract was sent 3 weeks ago – no confirmation received. Escalate to commercial director.',
    'OPEN', 'HIGH', NOW() - INTERVAL '7 days',
    'LEAD', '66666666-0000-0000-0000-000000000001',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND EXISTS (SELECT 1 FROM crm_leads l WHERE l.id = '66666666-0000-0000-0000-000000000001')
  AND NOT EXISTS (
      SELECT 1 FROM crm_tasks tk
      WHERE tk.id = 'd1111111-0000-0000-0000-000000000001'
  );

-- Overdue discovery call task linked to Beta Expansion lead
INSERT INTO crm_tasks (
    id, tenant_id, title, description,
    status, priority, due_date,
    related_type, related_id,
    created_by, updated_by
)
SELECT
    'd1111111-0000-0000-0000-000000000002',
    t.id,
    'Schedule discovery call – Beta Expansion',
    'Lead qualified last month. Discovery call not yet booked.',
    'OPEN', 'MEDIUM', NOW() - INTERVAL '2 days',
    'LEAD', '66666666-0000-0000-0000-000000000002',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND EXISTS (SELECT 1 FROM crm_leads l WHERE l.id = '66666666-0000-0000-0000-000000000002')
  AND NOT EXISTS (
      SELECT 1 FROM crm_tasks tk
      WHERE tk.id = 'd1111111-0000-0000-0000-000000000002'
  );

-- Pending task (not overdue – for pipeline balance), linked to Mary Smith contact
INSERT INTO crm_tasks (
    id, tenant_id, title, description,
    status, priority, due_date,
    related_type, related_id,
    created_by, updated_by
)
SELECT
    'd1111111-0000-0000-0000-000000000003',
    t.id,
    'Send proposal to Phaiffer Labs',
    'New product tier discussed in last meeting. Proposal draft ready.',
    'OPEN', 'MEDIUM', NOW() + INTERVAL '5 days',
    'CONTACT', '55555555-0000-0000-0000-000000000002',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND EXISTS (SELECT 1 FROM crm_contacts c WHERE c.id = '55555555-0000-0000-0000-000000000002')
  AND NOT EXISTS (
      SELECT 1 FROM crm_tasks tk
      WHERE tk.id = 'd1111111-0000-0000-0000-000000000003'
  );

-- ─── IoT alarms (additional severity variety) ────────────────────────────────

-- CRITICAL alarm on Boiler Sensor A
INSERT INTO iot_alarms (
    id, tenant_id, device_id, code, severity, message, status, triggered_at,
    created_by, updated_by
)
SELECT
    'bbbbbbb1-0000-0000-0000-000000000002',
    t.id, d.id,
    'PRESSURE_CRITICAL', 'CRITICAL',
    'Boiler pressure exceeded safe operating limit',
    'OPEN', NOW() - INTERVAL '30 minutes',
    'demo', 'demo'
FROM tenants t
JOIN iot_devices d ON d.tenant_id = t.id AND d.identifier = 'IOT-001'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM iot_alarms a
      WHERE a.id = 'bbbbbbb1-0000-0000-0000-000000000002'
  );

-- MEDIUM alarm on Generator Sensor B (additional operational context)
INSERT INTO iot_alarms (
    id, tenant_id, device_id, code, severity, message, status, triggered_at,
    created_by, updated_by
)
SELECT
    'bbbbbbb1-0000-0000-0000-000000000003',
    t.id, d.id,
    'VOLTAGE_LOW', 'MEDIUM',
    'Generator output voltage below expected range',
    'OPEN', NOW() - INTERVAL '5 hours',
    'demo', 'demo'
FROM tenants t
JOIN iot_devices d ON d.tenant_id = t.id AND d.identifier = 'IOT-002'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM iot_alarms a
      WHERE a.id = 'bbbbbbb1-0000-0000-0000-000000000003'
  );

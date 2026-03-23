-- Optional CRM sample seed for local development.
-- Includes contacts, leads, tasks (with overdue examples), and deals.

INSERT INTO crm_contacts (
    id,
    tenant_id,
    first_name,
    last_name,
    email,
    phone,
    company,
    status,
    owner_user_id,
    created_by,
    updated_by
)
SELECT
    '55555555-0000-0000-0000-000000000001',
    t.id,
    'John',
    'Doe',
    'john.doe@seed.local',
    '+5511911111111',
    'Seed Corp',
    'ACTIVE',
    u.id,
    'seed',
    'seed'
FROM tenants t
JOIN users u ON u.email = 'admin@local.test'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_contacts c
      WHERE c.tenant_id = t.id
        AND c.email = 'john.doe@seed.local'
  );

INSERT INTO crm_contacts (
    id,
    tenant_id,
    first_name,
    last_name,
    email,
    phone,
    company,
    status,
    owner_user_id,
    created_by,
    updated_by
)
SELECT
    '55555555-0000-0000-0000-000000000002',
    t.id,
    'Mary',
    'Smith',
    'mary.smith@seed.local',
    '+5511922222222',
    'Phaiffer Labs',
    'ACTIVE',
    u.id,
    'seed',
    'seed'
FROM tenants t
JOIN users u ON u.email = 'admin@local.test'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_contacts c
      WHERE c.tenant_id = t.id
        AND c.email = 'mary.smith@seed.local'
  );

INSERT INTO crm_leads (
    id,
    tenant_id,
    name,
    email,
    phone,
    source,
    status,
    assigned_user_id,
    created_by,
    updated_by
)
SELECT
    '66666666-0000-0000-0000-000000000001',
    t.id,
    'Acme Opportunity',
    'acme@lead.local',
    '+5511933333333',
    'WEBSITE',
    'NEW',
    u.id,
    'seed',
    'seed'
FROM tenants t
JOIN users u ON u.email = 'admin@local.test'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_leads l
      WHERE l.tenant_id = t.id
        AND l.email = 'acme@lead.local'
  );

INSERT INTO crm_leads (
    id,
    tenant_id,
    name,
    email,
    phone,
    source,
    status,
    assigned_user_id,
    created_by,
    updated_by
)
SELECT
    '66666666-0000-0000-0000-000000000002',
    t.id,
    'Beta Expansion',
    'beta@lead.local',
    '+5511944444444',
    'EVENT',
    'QUALIFIED',
    u.id,
    'seed',
    'seed'
FROM tenants t
JOIN users u ON u.email = 'admin@local.test'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_leads l
      WHERE l.tenant_id = t.id
        AND l.email = 'beta@lead.local'
  );

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
    'Contract was sent 3 weeks ago – no confirmation received.',
    'OPEN', 'HIGH', NOW() - INTERVAL '7 days',
    'LEAD', '66666666-0000-0000-0000-000000000001',
    'seed', 'seed'
FROM tenants t
WHERE t.code = 'default'
  AND EXISTS (SELECT 1 FROM crm_leads l WHERE l.id = '66666666-0000-0000-0000-000000000001')
  AND NOT EXISTS (
      SELECT 1 FROM crm_tasks tk
      WHERE tk.id = 'd1111111-0000-0000-0000-000000000001'
  );

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
    'New product tier discussed in last meeting.',
    'OPEN', 'MEDIUM', NOW() + INTERVAL '5 days',
    'CONTACT', '55555555-0000-0000-0000-000000000002',
    'seed', 'seed'
FROM tenants t
WHERE t.code = 'default'
  AND EXISTS (SELECT 1 FROM crm_contacts c WHERE c.id = '55555555-0000-0000-0000-000000000002')
  AND NOT EXISTS (
      SELECT 1 FROM crm_tasks tk
      WHERE tk.id = 'd1111111-0000-0000-0000-000000000003'
  );

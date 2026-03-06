-- Optional CRM sample seed for local development.

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

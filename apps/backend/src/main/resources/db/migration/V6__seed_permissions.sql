-- Granular permission seeds and role bindings.

INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001101'::uuid AS id, 'crm.contact.read' AS code, 'Read CRM contacts' AS description
    UNION ALL SELECT '00000000-0000-0000-0000-000000001102'::uuid, 'crm.contact.create', 'Create CRM contacts'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001103'::uuid, 'crm.contact.update', 'Update CRM contacts'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001104'::uuid, 'crm.contact.delete', 'Delete CRM contacts'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001105'::uuid, 'crm.lead.read', 'Read CRM leads'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001106'::uuid, 'crm.lead.create', 'Create CRM leads'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001107'::uuid, 'crm.lead.update', 'Update CRM leads'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001108'::uuid, 'crm.lead.delete', 'Delete CRM leads'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001109'::uuid, 'pet.client.read', 'Read pet clients'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001110'::uuid, 'iot.device.read', 'Read IoT devices'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions p
    WHERE p.code = seed.code
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'crm.contact.read'
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
JOIN permissions p ON p.code = 'crm.contact.create'
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
JOIN permissions p ON p.code = 'crm.contact.update'
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
JOIN permissions p ON p.code = 'crm.contact.delete'
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN')
  AND NOT EXISTS (
    SELECT 1
    FROM role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'crm.lead.read'
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
JOIN permissions p ON p.code = 'crm.lead.create'
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
JOIN permissions p ON p.code = 'crm.lead.update'
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
JOIN permissions p ON p.code = 'crm.lead.delete'
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN')
  AND NOT EXISTS (
    SELECT 1
    FROM role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'pet.client.read'
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
JOIN permissions p ON p.code = 'iot.device.read'
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')
  AND NOT EXISTS (
    SELECT 1
    FROM role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

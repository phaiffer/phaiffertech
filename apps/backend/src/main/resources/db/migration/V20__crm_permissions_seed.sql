-- CRM V1 granular permissions for companies, deals, pipeline, tasks, notes, activity and dashboard.

INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001111'::uuid AS id, 'crm.company.read' AS code, 'Read CRM companies' AS description
    UNION ALL SELECT '00000000-0000-0000-0000-000000001112'::uuid, 'crm.company.create', 'Create CRM companies'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001113'::uuid, 'crm.company.update', 'Update CRM companies'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001114'::uuid, 'crm.company.delete', 'Delete CRM companies'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001115'::uuid, 'crm.deal.read', 'Read CRM deals'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001116'::uuid, 'crm.deal.create', 'Create CRM deals'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001117'::uuid, 'crm.deal.update', 'Update CRM deals'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001118'::uuid, 'crm.deal.delete', 'Delete CRM deals'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001119'::uuid, 'crm.pipeline.read', 'Read CRM pipeline stages'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001120'::uuid, 'crm.pipeline.create', 'Create CRM pipeline stages'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001121'::uuid, 'crm.pipeline.update', 'Update CRM pipeline stages'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001122'::uuid, 'crm.pipeline.delete', 'Delete CRM pipeline stages'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001123'::uuid, 'crm.task.read', 'Read CRM tasks'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001124'::uuid, 'crm.task.create', 'Create CRM tasks'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001125'::uuid, 'crm.task.update', 'Update CRM tasks'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001126'::uuid, 'crm.task.delete', 'Delete CRM tasks'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001127'::uuid, 'crm.note.read', 'Read CRM notes'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001128'::uuid, 'crm.note.create', 'Create CRM notes'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001129'::uuid, 'crm.note.update', 'Update CRM notes'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001130'::uuid, 'crm.note.delete', 'Delete CRM notes'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001131'::uuid, 'crm.activity.read', 'Read CRM activity feed'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001132'::uuid, 'crm.dashboard.read', 'Read CRM dashboard summary'
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
    'crm.company.read', 'crm.deal.read', 'crm.pipeline.read', 'crm.task.read', 'crm.note.read',
    'crm.activity.read', 'crm.dashboard.read'
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
    'crm.company.create', 'crm.company.update',
    'crm.deal.create', 'crm.deal.update',
    'crm.task.create', 'crm.task.update',
    'crm.note.create', 'crm.note.update'
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
    'crm.company.delete', 'crm.deal.delete', 'crm.task.delete', 'crm.note.delete',
    'crm.pipeline.create', 'crm.pipeline.update', 'crm.pipeline.delete'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN')
  AND NOT EXISTS (
    SELECT 1
    FROM role_permissions rp
    WHERE rp.role_id = r.id
      AND rp.permission_id = p.id
  );

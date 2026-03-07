-- PET dashboard read permission and default role bindings.

INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001343' AS id, 'pet.dashboard.read' AS code, 'Read pet dashboard summary' AS description
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions p
    WHERE p.code = seed.code
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'pet.dashboard.read'
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

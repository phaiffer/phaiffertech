-- Reference seeds for RBAC, modules and local default tenant/admin.

INSERT INTO roles (id, code, name, description, system_role)
SELECT '00000000-0000-0000-0000-000000000001', 'PLATFORM_ADMIN', 'PLATFORM_ADMIN', 'Platform administrator role', b'1'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'PLATFORM_ADMIN');

INSERT INTO roles (id, code, name, description, system_role)
SELECT '00000000-0000-0000-0000-000000000002', 'TENANT_OWNER', 'TENANT_OWNER', 'Tenant owner role', b'1'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'TENANT_OWNER');

INSERT INTO roles (id, code, name, description, system_role)
SELECT '00000000-0000-0000-0000-000000000003', 'TENANT_ADMIN', 'TENANT_ADMIN', 'Tenant administrator role', b'1'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'TENANT_ADMIN');

INSERT INTO roles (id, code, name, description, system_role)
SELECT '00000000-0000-0000-0000-000000000004', 'MANAGER', 'MANAGER', 'Manager role', b'1'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'MANAGER');

INSERT INTO roles (id, code, name, description, system_role)
SELECT '00000000-0000-0000-0000-000000000005', 'OPERATOR', 'OPERATOR', 'Operator role', b'1'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'OPERATOR');

INSERT INTO roles (id, code, name, description, system_role)
SELECT '00000000-0000-0000-0000-000000000006', 'VIEWER', 'VIEWER', 'Viewer role', b'1'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'VIEWER');

INSERT INTO roles (id, code, name, description, system_role)
SELECT '00000000-0000-0000-0000-000000000007', 'CUSTOMER_PORTAL_USER', 'CUSTOMER_PORTAL_USER', 'Customer portal user role', b'1'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'CUSTOMER_PORTAL_USER');

INSERT INTO permissions (id, code, description)
SELECT '00000000-0000-0000-0000-000000001001', 'TENANT_READ', 'Read tenant data'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'TENANT_READ');

INSERT INTO permissions (id, code, description)
SELECT '00000000-0000-0000-0000-000000001002', 'TENANT_WRITE', 'Write tenant data'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'TENANT_WRITE');

INSERT INTO permissions (id, code, description)
SELECT '00000000-0000-0000-0000-000000001003', 'USER_READ', 'Read user data'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'USER_READ');

INSERT INTO permissions (id, code, description)
SELECT '00000000-0000-0000-0000-000000001004', 'USER_WRITE', 'Write user data'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'USER_WRITE');

INSERT INTO permissions (id, code, description)
SELECT '00000000-0000-0000-0000-000000001005', 'MODULE_READ', 'Read module registry data'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'MODULE_READ');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'TENANT_READ'
WHERE r.code = 'PLATFORM_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'TENANT_WRITE'
WHERE r.code = 'PLATFORM_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'USER_READ'
WHERE r.code = 'PLATFORM_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'USER_WRITE'
WHERE r.code = 'PLATFORM_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'MODULE_READ'
WHERE r.code = 'PLATFORM_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

INSERT INTO module_definitions (id, code, name, description, active)
SELECT '00000000-0000-0000-0000-000000002001', 'CORE_PLATFORM', 'Core Platform', 'Shared platform capabilities', b'1'
WHERE NOT EXISTS (SELECT 1 FROM module_definitions WHERE code = 'CORE_PLATFORM');

INSERT INTO module_definitions (id, code, name, description, active)
SELECT '00000000-0000-0000-0000-000000002002', 'CRM', 'CRM', 'Contacts, leads and sales operations', b'1'
WHERE NOT EXISTS (SELECT 1 FROM module_definitions WHERE code = 'CRM');

INSERT INTO module_definitions (id, code, name, description, active)
SELECT '00000000-0000-0000-0000-000000002003', 'PET', 'PET', 'Pet care and clinic operations', b'1'
WHERE NOT EXISTS (SELECT 1 FROM module_definitions WHERE code = 'PET');

INSERT INTO module_definitions (id, code, name, description, active)
SELECT '00000000-0000-0000-0000-000000002004', 'IOT', 'IOT', 'Device and telemetry operations', b'1'
WHERE NOT EXISTS (SELECT 1 FROM module_definitions WHERE code = 'IOT');

INSERT INTO tenants (id, name, code, status)
SELECT '11111111-1111-1111-1111-111111111111', 'Default Tenant', 'default', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE code = 'default');

INSERT INTO users (id, email, password_hash, full_name, active)
SELECT '22222222-2222-2222-2222-222222222222', 'admin@local.test', '$2a$10$28RqVTDwgyR5J0XvjGFsUOhADXAU/xi/VX0fhlSoBv46MgMc3HDJi', 'Platform Admin', b'1'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@local.test');

INSERT INTO user_tenants (id, tenant_id, user_id, role_id, active)
SELECT '33333333-3333-3333-3333-333333333333', t.id, u.id, r.id, b'1'
FROM tenants t
JOIN users u ON u.email = 'admin@local.test'
JOIN roles r ON r.code = 'PLATFORM_ADMIN'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM user_tenants ut WHERE ut.tenant_id = t.id AND ut.user_id = u.id
  );

INSERT INTO tenant_modules (id, tenant_id, module_definition_id, enabled)
SELECT '44444444-4444-4444-4444-444444444001', t.id, m.id, b'1'
FROM tenants t
JOIN module_definitions m ON m.code = 'CORE_PLATFORM'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM tenant_modules tm WHERE tm.tenant_id = t.id AND tm.module_definition_id = m.id
  );

INSERT INTO tenant_modules (id, tenant_id, module_definition_id, enabled)
SELECT '44444444-4444-4444-4444-444444444002', t.id, m.id, b'1'
FROM tenants t
JOIN module_definitions m ON m.code = 'CRM'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM tenant_modules tm WHERE tm.tenant_id = t.id AND tm.module_definition_id = m.id
  );

INSERT INTO tenant_modules (id, tenant_id, module_definition_id, enabled)
SELECT '44444444-4444-4444-4444-444444444003', t.id, m.id, b'1'
FROM tenants t
JOIN module_definitions m ON m.code = 'PET'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM tenant_modules tm WHERE tm.tenant_id = t.id AND tm.module_definition_id = m.id
  );

INSERT INTO tenant_modules (id, tenant_id, module_definition_id, enabled)
SELECT '44444444-4444-4444-4444-444444444004', t.id, m.id, b'1'
FROM tenants t
JOIN module_definitions m ON m.code = 'IOT'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM tenant_modules tm WHERE tm.tenant_id = t.id AND tm.module_definition_id = m.id
  );

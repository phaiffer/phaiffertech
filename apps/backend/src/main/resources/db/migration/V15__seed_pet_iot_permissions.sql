-- PET and IoT permission seeds and role bindings.

INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001201' AS id, 'pet.client.read' AS code, 'Read pet clients' AS description
    UNION ALL SELECT '00000000-0000-0000-0000-000000001202', 'pet.client.create', 'Create pet clients'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001203', 'pet.client.update', 'Update pet clients'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001204', 'pet.client.delete', 'Delete pet clients'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001205', 'pet.profile.read', 'Read pet profiles'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001206', 'pet.profile.create', 'Create pet profiles'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001207', 'pet.profile.update', 'Update pet profiles'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001208', 'pet.profile.delete', 'Delete pet profiles'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001209', 'pet.appointment.read', 'Read pet appointments'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001210', 'pet.appointment.create', 'Create pet appointments'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001211', 'pet.appointment.update', 'Update pet appointments'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001212', 'pet.appointment.delete', 'Delete pet appointments'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001213', 'iot.device.create', 'Create IoT devices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001214', 'iot.device.update', 'Update IoT devices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001215', 'iot.device.delete', 'Delete IoT devices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001216', 'iot.alarm.read', 'Read IoT alarms'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001217', 'iot.alarm.create', 'Create IoT alarms'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001218', 'iot.alarm.update', 'Update IoT alarms'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001219', 'iot.alarm.delete', 'Delete IoT alarms'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001220', 'iot.alarm.ack', 'Acknowledge IoT alarms'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001221', 'iot.telemetry.read', 'Read IoT telemetry records'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001222', 'iot.telemetry.write', 'Write IoT telemetry records'
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
    'pet.client.read',
    'pet.profile.read',
    'pet.appointment.read',
    'iot.device.read',
    'iot.alarm.read',
    'iot.telemetry.read'
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
    'pet.client.create',
    'pet.profile.create',
    'pet.appointment.create',
    'iot.device.create',
    'iot.alarm.create',
    'iot.telemetry.write'
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
    'pet.client.update',
    'pet.profile.update',
    'pet.appointment.update',
    'iot.device.update',
    'iot.alarm.update'
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
    'pet.client.delete',
    'pet.profile.delete',
    'pet.appointment.delete',
    'iot.device.delete',
    'iot.alarm.delete'
)
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
JOIN permissions p ON p.code = 'iot.alarm.ack'
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

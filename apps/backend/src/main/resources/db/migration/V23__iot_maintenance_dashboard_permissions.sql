-- IoT V1 maintenance schema, dashboard/report permissions, and role bindings.

CREATE TABLE iot_maintenance (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    device_id CHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(40) NOT NULL DEFAULT 'MEDIUM',
    scheduled_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    assigned_user_id CHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_iot_maintenance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_iot_maintenance_device FOREIGN KEY (device_id) REFERENCES iot_devices (id),
    INDEX idx_iot_maintenance_device_status (tenant_id, device_id, status),
    INDEX idx_iot_maintenance_status_priority (tenant_id, status, priority),
    INDEX idx_iot_maintenance_schedule (tenant_id, scheduled_at)
);

INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001301' AS id, 'iot.register.read' AS code, 'Read IoT registers' AS description
    UNION ALL SELECT '00000000-0000-0000-0000-000000001302', 'iot.register.create', 'Create IoT registers'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001303', 'iot.register.update', 'Update IoT registers'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001304', 'iot.register.delete', 'Delete IoT registers'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001305', 'iot.maintenance.read', 'Read IoT maintenance orders'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001306', 'iot.maintenance.create', 'Create IoT maintenance orders'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001307', 'iot.maintenance.update', 'Update IoT maintenance orders'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001308', 'iot.maintenance.delete', 'Delete IoT maintenance orders'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001309', 'iot.dashboard.read', 'Read IoT dashboard summary'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001310', 'iot.report.read', 'Read IoT reports summary'
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
    'iot.register.read',
    'iot.maintenance.read',
    'iot.dashboard.read',
    'iot.report.read'
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
    'iot.register.create',
    'iot.register.update',
    'iot.maintenance.create',
    'iot.maintenance.update'
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
    'iot.register.delete',
    'iot.maintenance.delete'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

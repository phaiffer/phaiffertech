-- Phase 24B Cleanup: Create backing table for ClientPlan entity and seed required permissions.
-- This migration was missing from the original ClientPlan implementation.

CREATE TABLE pet_client_plans (
    id            UUID         PRIMARY KEY,
    tenant_id     UUID         NOT NULL,
    client_id     UUID         NOT NULL,
    plan_name     VARCHAR(120) NOT NULL,
    total_sessions INT         NOT NULL,
    used_sessions  INT         NOT NULL DEFAULT 0,
    expires_at    TIMESTAMPTZ  NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    VARCHAR(64)  NOT NULL DEFAULT 'system',
    updated_by    VARCHAR(64)  NOT NULL DEFAULT 'system',
    deleted_at    TIMESTAMPTZ  NULL,
    CONSTRAINT fk_pet_client_plans_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants (id),
    CONSTRAINT fk_pet_client_plans_client  FOREIGN KEY (client_id)  REFERENCES pet_clients (id),
    CONSTRAINT chk_pet_client_plans_total_sessions_positive CHECK (total_sessions >= 1),
    CONSTRAINT chk_pet_client_plans_used_sessions_non_negative CHECK (used_sessions >= 0),
    CONSTRAINT chk_pet_client_plans_used_le_total CHECK (used_sessions <= total_sessions)
);

CREATE INDEX idx_pet_client_plans_tenant_client
    ON pet_client_plans (tenant_id, client_id, deleted_at);

CREATE INDEX idx_pet_client_plans_tenant_expires
    ON pet_client_plans (tenant_id, expires_at)
    WHERE deleted_at IS NULL;

-- Seed plan permissions using the project-standard fixed-UUID pattern.
-- Next available block after V43 (000000001357): 000000001358–000000001360.
INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001358'::uuid AS id, 'pet.plan.create' AS code, 'Create pet client plans' AS description
    UNION ALL SELECT '00000000-0000-0000-0000-000000001359'::uuid, 'pet.plan.read',   'Read pet client plans'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001360'::uuid, 'pet.plan.use',    'Consume a session from a pet client plan'
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p WHERE p.code = seed.code
);

-- pet.plan.read: all authenticated roles can read plans.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('pet.plan.read')
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- pet.plan.create, pet.plan.use: operational roles only.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('pet.plan.create', 'pet.plan.use')
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

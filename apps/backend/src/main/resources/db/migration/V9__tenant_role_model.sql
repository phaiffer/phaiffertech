-- Explicit tenant role model: user_tenants + user_tenant_roles.

CREATE TABLE user_tenant_roles (
    id UUID PRIMARY KEY,
    user_tenant_id UUID NOT NULL,
    role_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_tenant_roles_user_tenant FOREIGN KEY (user_tenant_id) REFERENCES user_tenants (id),
    CONSTRAINT fk_user_tenant_roles_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT uq_user_tenant_roles UNIQUE (user_tenant_id, role_id)
);

CREATE INDEX idx_user_tenant_roles_user_tenant ON user_tenant_roles (user_tenant_id);
CREATE INDEX idx_user_tenant_roles_role ON user_tenant_roles (role_id);

INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at)
SELECT gen_random_uuid(), ut.id, ut.role_id, COALESCE(ut.created_at, CURRENT_TIMESTAMP)
FROM user_tenants ut
LEFT JOIN user_tenant_roles utr
       ON utr.user_tenant_id = ut.id
      AND utr.role_id = ut.role_id
WHERE ut.role_id IS NOT NULL
  AND utr.id IS NULL;

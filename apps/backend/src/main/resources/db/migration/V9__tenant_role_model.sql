-- Explicit tenant role model: user_tenants + user_tenant_roles.

CREATE TABLE user_tenant_roles (
    id CHAR(36) PRIMARY KEY,
    user_tenant_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_tenant_roles_user_tenant FOREIGN KEY (user_tenant_id) REFERENCES user_tenants (id),
    CONSTRAINT fk_user_tenant_roles_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT uq_user_tenant_roles UNIQUE (user_tenant_id, role_id),
    INDEX idx_user_tenant_roles_user_tenant (user_tenant_id),
    INDEX idx_user_tenant_roles_role (role_id)
);

INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at)
SELECT UUID(), ut.id, ut.role_id, COALESCE(ut.created_at, CURRENT_TIMESTAMP)
FROM user_tenants ut
LEFT JOIN user_tenant_roles utr
       ON utr.user_tenant_id = ut.id
      AND utr.role_id = ut.role_id
WHERE ut.role_id IS NOT NULL
  AND utr.id IS NULL;

CREATE TABLE support_impersonation_sessions (
    id UUID PRIMARY KEY,
    platform_admin_user_id UUID NOT NULL,
    platform_admin_tenant_id UUID NOT NULL,
    target_tenant_id UUID NOT NULL,
    target_user_id UUID NULL,
    reason VARCHAR(500) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64) NOT NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_support_impersonation_sessions_platform_admin_user
        FOREIGN KEY (platform_admin_user_id) REFERENCES users (id),
    CONSTRAINT fk_support_impersonation_sessions_platform_admin_tenant
        FOREIGN KEY (platform_admin_tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_support_impersonation_sessions_target_tenant
        FOREIGN KEY (target_tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_support_impersonation_sessions_target_user
        FOREIGN KEY (target_user_id) REFERENCES users (id),
    CONSTRAINT chk_support_impersonation_sessions_status
        CHECK (status IN ('ACTIVE', 'ENDED', 'EXPIRED')),
    CONSTRAINT chk_support_impersonation_sessions_reason
        CHECK (char_length(trim(reason)) >= 10),
    CONSTRAINT chk_support_impersonation_sessions_expiry
        CHECK (expires_at > started_at),
    CONSTRAINT chk_support_impersonation_sessions_end
        CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX idx_support_impersonation_sessions_platform_admin
    ON support_impersonation_sessions (platform_admin_user_id, status, expires_at DESC);

CREATE INDEX idx_support_impersonation_sessions_target_tenant
    ON support_impersonation_sessions (target_tenant_id, started_at DESC);

CREATE INDEX idx_support_impersonation_sessions_expires_at
    ON support_impersonation_sessions (expires_at);

CREATE UNIQUE INDEX uq_support_impersonation_sessions_active_admin
    ON support_impersonation_sessions (platform_admin_user_id)
    WHERE status = 'ACTIVE' AND ended_at IS NULL;

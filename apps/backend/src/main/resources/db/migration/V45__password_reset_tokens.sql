CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_password_reset_tokens_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_password_reset_tokens_token_hash
        UNIQUE (token_hash),
    CONSTRAINT chk_password_reset_tokens_expiry
        CHECK (expires_at > created_at),
    CONSTRAINT chk_password_reset_tokens_used_at
        CHECK (used_at IS NULL OR used_at >= created_at)
);

CREATE INDEX idx_password_reset_tokens_tenant_user
    ON password_reset_tokens (tenant_id, user_id, created_at DESC);

CREATE INDEX idx_password_reset_tokens_token_hash
    ON password_reset_tokens (token_hash);

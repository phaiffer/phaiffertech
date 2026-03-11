-- Harden refresh token persistence and extend audit logs metadata.

ALTER TABLE refresh_tokens
    ALTER COLUMN token DROP NOT NULL;

ALTER TABLE refresh_tokens
    ADD COLUMN token_hash VARCHAR(64) NULL;

UPDATE refresh_tokens
SET token_hash = encode(digest(token, 'sha256'), 'hex'),
    token = NULL
WHERE token_hash IS NULL
  AND token IS NOT NULL;

ALTER TABLE refresh_tokens
    ALTER COLUMN token_hash SET NOT NULL;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash);

CREATE INDEX idx_refresh_tokens_tenant_user_status
    ON refresh_tokens (tenant_id, user_id, revoked_at, expires_at);

ALTER TABLE audit_logs
    ADD COLUMN user_id UUID NULL;

ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id);

CREATE INDEX idx_audit_logs_user_created
    ON audit_logs (user_id, created_at);

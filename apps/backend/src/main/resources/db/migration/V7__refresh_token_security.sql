-- Harden refresh token persistence and extend audit logs metadata.

ALTER TABLE refresh_tokens
    MODIFY token VARCHAR(255) NULL;

ALTER TABLE refresh_tokens
    ADD COLUMN token_hash VARCHAR(64) NULL AFTER token;

UPDATE refresh_tokens
SET token_hash = SHA2(token, 256),
    token = NULL
WHERE token_hash IS NULL
  AND token IS NOT NULL;

ALTER TABLE refresh_tokens
    MODIFY token_hash VARCHAR(64) NOT NULL,
    ADD UNIQUE INDEX uq_refresh_tokens_token_hash (token_hash),
    ADD INDEX idx_refresh_tokens_tenant_user_status (tenant_id, user_id, revoked_at, expires_at);

ALTER TABLE audit_logs
    ADD COLUMN user_id CHAR(36) NULL AFTER tenant_id,
    ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id),
    ADD INDEX idx_audit_logs_user_created (user_id, created_at);

CREATE TABLE rate_limit_policies (
    id UUID PRIMARY KEY,
    policy_key VARCHAR(80) NOT NULL,
    route_pattern VARCHAR(150) NOT NULL,
    capacity INT NOT NULL,
    refill_tokens INT NOT NULL,
    refill_period_seconds INT NOT NULL,
    tenant_id UUID NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_rate_limit_policy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT uq_rate_limit_policy_key_tenant UNIQUE (policy_key, tenant_id)
);

CREATE INDEX idx_rate_limit_policy_tenant ON rate_limit_policies (tenant_id);
CREATE INDEX idx_rate_limit_policy_route ON rate_limit_policies (route_pattern);

INSERT INTO rate_limit_policies (
    id, policy_key, route_pattern, capacity, refill_tokens, refill_period_seconds, tenant_id, enabled
)
SELECT '00000000-0000-0000-0000-000000003101', 'auth.default', '/api/v1/auth/**', 10, 10, 60, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM rate_limit_policies WHERE policy_key = 'auth.default' AND tenant_id IS NULL);

INSERT INTO rate_limit_policies (
    id, policy_key, route_pattern, capacity, refill_tokens, refill_period_seconds, tenant_id, enabled
)
SELECT '00000000-0000-0000-0000-000000003102', 'api.default', '/api/v1/**', 100, 100, 60, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM rate_limit_policies WHERE policy_key = 'api.default' AND tenant_id IS NULL);

INSERT INTO rate_limit_policies (
    id, policy_key, route_pattern, capacity, refill_tokens, refill_period_seconds, tenant_id, enabled
)
SELECT '00000000-0000-0000-0000-000000003103', 'telemetry.default', '/api/v1/iot/telemetry', 500, 500, 60, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM rate_limit_policies WHERE policy_key = 'telemetry.default' AND tenant_id IS NULL);

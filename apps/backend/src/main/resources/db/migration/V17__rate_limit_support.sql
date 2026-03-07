CREATE TABLE rate_limit_policies (
    id CHAR(36) PRIMARY KEY,
    policy_key VARCHAR(80) NOT NULL,
    route_pattern VARCHAR(150) NOT NULL,
    capacity INT NOT NULL,
    refill_tokens INT NOT NULL,
    refill_period_seconds INT NOT NULL,
    tenant_id CHAR(36) NULL,
    enabled BIT(1) NOT NULL DEFAULT b'1',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_rate_limit_policy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    INDEX idx_rate_limit_policy_tenant (tenant_id),
    INDEX idx_rate_limit_policy_route (route_pattern),
    UNIQUE KEY uq_rate_limit_policy_key_tenant (policy_key, tenant_id)
);

INSERT INTO rate_limit_policies (
    id, policy_key, route_pattern, capacity, refill_tokens, refill_period_seconds, tenant_id, enabled
)
SELECT '00000000-0000-0000-0000-000000003101', 'auth.default', '/api/v1/auth/**', 10, 10, 60, NULL, b'1'
WHERE NOT EXISTS (SELECT 1 FROM rate_limit_policies WHERE policy_key = 'auth.default' AND tenant_id IS NULL);

INSERT INTO rate_limit_policies (
    id, policy_key, route_pattern, capacity, refill_tokens, refill_period_seconds, tenant_id, enabled
)
SELECT '00000000-0000-0000-0000-000000003102', 'api.default', '/api/v1/**', 100, 100, 60, NULL, b'1'
WHERE NOT EXISTS (SELECT 1 FROM rate_limit_policies WHERE policy_key = 'api.default' AND tenant_id IS NULL);

INSERT INTO rate_limit_policies (
    id, policy_key, route_pattern, capacity, refill_tokens, refill_period_seconds, tenant_id, enabled
)
SELECT '00000000-0000-0000-0000-000000003103', 'telemetry.default', '/api/v1/iot/telemetry', 500, 500, 60, NULL, b'1'
WHERE NOT EXISTS (SELECT 1 FROM rate_limit_policies WHERE policy_key = 'telemetry.default' AND tenant_id IS NULL);

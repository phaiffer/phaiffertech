CREATE TABLE feature_flags (
    id UUID PRIMARY KEY,
    flag_key VARCHAR(120) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    tenant_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_feature_flags_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT uq_feature_flags_key_tenant UNIQUE (flag_key, tenant_id)
);

CREATE INDEX idx_feature_flags_key ON feature_flags (flag_key);
CREATE INDEX idx_feature_flags_tenant ON feature_flags (tenant_id);

INSERT INTO feature_flags (id, flag_key, enabled, tenant_id)
SELECT '00000000-0000-0000-0000-000000003001', 'crm.enabled', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key = 'crm.enabled' AND tenant_id IS NULL);

INSERT INTO feature_flags (id, flag_key, enabled, tenant_id)
SELECT '00000000-0000-0000-0000-000000003002', 'pet.enabled', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key = 'pet.enabled' AND tenant_id IS NULL);

INSERT INTO feature_flags (id, flag_key, enabled, tenant_id)
SELECT '00000000-0000-0000-0000-000000003003', 'iot.enabled', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key = 'iot.enabled' AND tenant_id IS NULL);

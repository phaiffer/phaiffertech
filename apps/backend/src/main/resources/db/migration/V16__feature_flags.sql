CREATE TABLE feature_flags (
    id CHAR(36) PRIMARY KEY,
    flag_key VARCHAR(120) NOT NULL,
    enabled BIT(1) NOT NULL DEFAULT b'1',
    tenant_id CHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_feature_flags_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    INDEX idx_feature_flags_key (flag_key),
    INDEX idx_feature_flags_tenant (tenant_id),
    UNIQUE KEY uq_feature_flags_key_tenant (flag_key, tenant_id)
);

INSERT INTO feature_flags (id, flag_key, enabled, tenant_id)
SELECT '00000000-0000-0000-0000-000000003001', 'crm.enabled', b'1', NULL
WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key = 'crm.enabled' AND tenant_id IS NULL);

INSERT INTO feature_flags (id, flag_key, enabled, tenant_id)
SELECT '00000000-0000-0000-0000-000000003002', 'pet.enabled', b'1', NULL
WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key = 'pet.enabled' AND tenant_id IS NULL);

INSERT INTO feature_flags (id, flag_key, enabled, tenant_id)
SELECT '00000000-0000-0000-0000-000000003003', 'iot.enabled', b'1', NULL
WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE flag_key = 'iot.enabled' AND tenant_id IS NULL);

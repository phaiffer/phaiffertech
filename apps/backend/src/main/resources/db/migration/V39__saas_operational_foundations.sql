ALTER TABLE tenants
    ADD COLUMN plan_code VARCHAR(80) NOT NULL DEFAULT 'STANDARD';

UPDATE tenants
SET plan_code = COALESCE(NULLIF(TRIM(plan_code), ''), 'STANDARD');

CREATE TABLE tenant_feature_entitlements (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    feature_key VARCHAR(120) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    source VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_tenant_feature_entitlements_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT uq_tenant_feature_entitlements_tenant_feature UNIQUE (tenant_id, feature_key)
);

CREATE INDEX idx_tenant_feature_entitlements_tenant
    ON tenant_feature_entitlements (tenant_id);

CREATE INDEX idx_tenant_feature_entitlements_feature
    ON tenant_feature_entitlements (feature_key);

CREATE TABLE tenant_usage_metrics (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    metric_key VARCHAR(120) NOT NULL,
    source VARCHAR(120) NOT NULL,
    metric_date DATE NOT NULL,
    quantity BIGINT NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL DEFAULT 'COUNT',
    last_recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_tenant_usage_metrics_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT uq_tenant_usage_metrics_tenant_metric_source_day UNIQUE (tenant_id, metric_key, source, metric_date)
);

CREATE INDEX idx_tenant_usage_metrics_tenant_date
    ON tenant_usage_metrics (tenant_id, metric_date);

CREATE INDEX idx_tenant_usage_metrics_metric_source
    ON tenant_usage_metrics (metric_key, source);

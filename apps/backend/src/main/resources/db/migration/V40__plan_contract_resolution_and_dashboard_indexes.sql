ALTER TABLE tenant_modules
    ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'MANUAL';

UPDATE tenants
SET plan_code = 'ENTERPRISE'
WHERE code = 'default';

UPDATE tenant_modules tm
SET source = CASE
    WHEN md.code = 'CORE_PLATFORM' THEN 'PLAN'
    WHEN t.plan_code = 'BASIC' AND md.code IN ('CRM') THEN 'PLAN'
    WHEN t.plan_code = 'STANDARD' AND md.code IN ('CRM', 'PET') THEN 'PLAN'
    WHEN t.plan_code = 'PRO' AND md.code IN ('CRM', 'PET', 'IOT') THEN 'PLAN'
    WHEN t.plan_code = 'ENTERPRISE' AND md.code IN ('CRM', 'PET', 'IOT') THEN 'PLAN'
    ELSE 'MANUAL'
END
FROM tenants t
, module_definitions md
WHERE t.id = tm.tenant_id
  AND md.id = tm.module_definition_id;

INSERT INTO tenant_feature_entitlements (
    id,
    tenant_id,
    feature_key,
    enabled,
    source,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at
)
SELECT
    gen_random_uuid(),
    t.id,
    plan_features.feature_key,
    TRUE,
    'PLAN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'migration',
    'migration',
    NULL
FROM tenants t
CROSS JOIN LATERAL (
    SELECT 'crm.basic' AS feature_key WHERE t.plan_code = 'BASIC'
    UNION ALL
    SELECT 'crm.full' WHERE t.plan_code IN ('STANDARD', 'PRO')
    UNION ALL
    SELECT 'pet.basic' WHERE t.plan_code = 'STANDARD'
    UNION ALL
    SELECT 'pet.full' WHERE t.plan_code = 'PRO'
    UNION ALL
    SELECT 'iot.basic' WHERE t.plan_code = 'PRO'
    UNION ALL
    SELECT '*' WHERE t.plan_code = 'ENTERPRISE'
) plan_features
ON CONFLICT (tenant_id, feature_key) DO UPDATE
SET enabled = TRUE,
    source = CASE
        WHEN tenant_feature_entitlements.source IN ('MANUAL', 'PLAN_MANUAL') THEN 'PLAN_MANUAL'
        ELSE 'PLAN'
    END,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration';

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant_definition_enabled
    ON tenant_modules (tenant_id, module_definition_id, enabled, deleted_at);

CREATE INDEX IF NOT EXISTS idx_tenant_feature_entitlements_tenant_enabled_feature
    ON tenant_feature_entitlements (tenant_id, enabled, deleted_at, feature_key);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_metrics_tenant_metric_window
    ON tenant_usage_metrics (tenant_id, metric_key, metric_date DESC, last_recorded_at DESC, source);

CREATE INDEX IF NOT EXISTS idx_crm_deals_dashboard_open
    ON crm_deals (tenant_id, pipeline_stage_id)
    WHERE deleted_at IS NULL
      AND UPPER(status) NOT IN ('CLOSED', 'CLOSED_WON', 'CLOSED_LOST', 'WON', 'LOST');

CREATE INDEX IF NOT EXISTS idx_crm_tasks_dashboard_pending
    ON crm_tasks (tenant_id, due_date)
    WHERE deleted_at IS NULL
      AND UPPER(status) <> 'DONE';

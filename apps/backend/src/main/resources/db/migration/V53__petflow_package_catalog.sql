ALTER TABLE tenants
    ALTER COLUMN plan_code SET DEFAULT 'PETSHOP';

UPDATE tenants
SET plan_code = CASE UPPER(COALESCE(NULLIF(TRIM(plan_code), ''), 'PETSHOP'))
    WHEN 'BASIC' THEN 'PETSHOP'
    WHEN 'STANDARD' THEN 'PETSHOP_BANHO_TOSA'
    WHEN 'PRO' THEN 'BANHO_TOSA_CLINICA'
    WHEN 'ENTERPRISE' THEN 'BANHO_TOSA_CLINICA'
    WHEN 'PETSHOP_CLINICA' THEN 'CLINICA_VETERINARIA'
    WHEN 'PETSHOP_BANHO_TOSA_CLINICA' THEN 'BANHO_TOSA_CLINICA'
    ELSE UPPER(COALESCE(NULLIF(TRIM(plan_code), ''), 'PETSHOP'))
END;

UPDATE tenants
SET plan_code = 'PETSHOP'
WHERE plan_code NOT IN (
    'PETSHOP',
    'BANHO_TOSA',
    'CLINICA_VETERINARIA',
    'PETSHOP_BANHO_TOSA',
    'BANHO_TOSA_CLINICA'
);

WITH desired_plan_modules AS (
    SELECT t.id AS tenant_id, md.id AS module_definition_id
    FROM tenants t
    JOIN module_definitions md ON md.code IN ('CORE_PLATFORM', 'PET')
)
INSERT INTO tenant_modules (
    id,
    tenant_id,
    module_definition_id,
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
    dpm.tenant_id,
    dpm.module_definition_id,
    TRUE,
    'PLAN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'migration',
    'migration',
    NULL
FROM desired_plan_modules dpm
ON CONFLICT (tenant_id, module_definition_id) DO UPDATE
SET enabled = TRUE,
    source = CASE
        WHEN tenant_modules.source IN ('MANUAL', 'PLAN_MANUAL') THEN 'PLAN_MANUAL'
        ELSE 'PLAN'
    END,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration';

UPDATE tenant_modules tm
SET enabled = FALSE,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration'
FROM module_definitions md
WHERE md.id = tm.module_definition_id
  AND md.code IN ('CRM', 'IOT')
  AND tm.source = 'PLAN';

UPDATE tenant_modules tm
SET source = 'MANUAL',
    enabled = TRUE,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration'
FROM module_definitions md
WHERE md.id = tm.module_definition_id
  AND md.code IN ('CRM', 'IOT')
  AND tm.source = 'PLAN_MANUAL';

WITH platform_owner_manual_modules AS (
    SELECT t.id AS tenant_id, md.id AS module_definition_id
    FROM tenants t
    JOIN module_definitions md ON md.code IN ('CRM', 'IOT')
    WHERE t.platform_owner = TRUE
)
INSERT INTO tenant_modules (
    id,
    tenant_id,
    module_definition_id,
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
    pmm.tenant_id,
    pmm.module_definition_id,
    TRUE,
    'MANUAL',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'migration',
    'migration',
    NULL
FROM platform_owner_manual_modules pmm
ON CONFLICT (tenant_id, module_definition_id) DO UPDATE
SET enabled = TRUE,
    source = 'MANUAL',
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration';

WITH package_feature_map AS (
    SELECT 'PETSHOP' AS plan_code, 'pet.retail' AS feature_key
    UNION ALL SELECT 'BANHO_TOSA', 'pet.aesthetics'
    UNION ALL SELECT 'BANHO_TOSA', 'pet.retail'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.clinic'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.veterinary'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.retail'
    UNION ALL SELECT 'PETSHOP_BANHO_TOSA', 'pet.aesthetics'
    UNION ALL SELECT 'PETSHOP_BANHO_TOSA', 'pet.retail'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.aesthetics'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.clinic'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.veterinary'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.retail'
),
desired_plan_entitlements AS (
    SELECT t.id AS tenant_id, pfm.feature_key
    FROM tenants t
    JOIN package_feature_map pfm ON pfm.plan_code = t.plan_code
)
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
    dpe.tenant_id,
    dpe.feature_key,
    TRUE,
    'PLAN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'migration',
    'migration',
    NULL
FROM desired_plan_entitlements dpe
ON CONFLICT (tenant_id, feature_key) DO UPDATE
SET enabled = TRUE,
    source = CASE
        WHEN tenant_feature_entitlements.source IN ('MANUAL', 'PLAN_MANUAL') THEN 'PLAN_MANUAL'
        ELSE 'PLAN'
    END,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration';

WITH package_feature_map AS (
    SELECT 'PETSHOP' AS plan_code, 'pet.retail' AS feature_key
    UNION ALL SELECT 'BANHO_TOSA', 'pet.aesthetics'
    UNION ALL SELECT 'BANHO_TOSA', 'pet.retail'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.clinic'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.veterinary'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.retail'
    UNION ALL SELECT 'PETSHOP_BANHO_TOSA', 'pet.aesthetics'
    UNION ALL SELECT 'PETSHOP_BANHO_TOSA', 'pet.retail'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.aesthetics'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.clinic'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.veterinary'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.retail'
),
desired_plan_entitlements AS (
    SELECT t.id AS tenant_id, pfm.feature_key
    FROM tenants t
    JOIN package_feature_map pfm ON pfm.plan_code = t.plan_code
)
UPDATE tenant_feature_entitlements tfe
SET enabled = FALSE,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration'
WHERE tfe.source = 'PLAN'
  AND NOT EXISTS (
      SELECT 1
      FROM desired_plan_entitlements dpe
      WHERE dpe.tenant_id = tfe.tenant_id
        AND dpe.feature_key = LOWER(tfe.feature_key)
  );

WITH package_feature_map AS (
    SELECT 'PETSHOP' AS plan_code, 'pet.retail' AS feature_key
    UNION ALL SELECT 'BANHO_TOSA', 'pet.aesthetics'
    UNION ALL SELECT 'BANHO_TOSA', 'pet.retail'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.clinic'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.veterinary'
    UNION ALL SELECT 'CLINICA_VETERINARIA', 'pet.retail'
    UNION ALL SELECT 'PETSHOP_BANHO_TOSA', 'pet.aesthetics'
    UNION ALL SELECT 'PETSHOP_BANHO_TOSA', 'pet.retail'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.aesthetics'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.clinic'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.veterinary'
    UNION ALL SELECT 'BANHO_TOSA_CLINICA', 'pet.retail'
),
desired_plan_entitlements AS (
    SELECT t.id AS tenant_id, pfm.feature_key
    FROM tenants t
    JOIN package_feature_map pfm ON pfm.plan_code = t.plan_code
)
UPDATE tenant_feature_entitlements tfe
SET source = 'MANUAL',
    enabled = TRUE,
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration'
WHERE tfe.source = 'PLAN_MANUAL'
  AND NOT EXISTS (
      SELECT 1
      FROM desired_plan_entitlements dpe
      WHERE dpe.tenant_id = tfe.tenant_id
        AND dpe.feature_key = LOWER(tfe.feature_key)
  );

WITH platform_owner_manual_entitlements AS (
    SELECT t.id AS tenant_id, feature_key
    FROM tenants t
    CROSS JOIN (
        SELECT 'crm.full' AS feature_key
        UNION ALL
        SELECT 'iot.basic'
    ) entitlement_keys
    WHERE t.platform_owner = TRUE
)
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
    pome.tenant_id,
    pome.feature_key,
    TRUE,
    'MANUAL',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'migration',
    'migration',
    NULL
FROM platform_owner_manual_entitlements pome
ON CONFLICT (tenant_id, feature_key) DO UPDATE
SET enabled = TRUE,
    source = 'MANUAL',
    deleted_at = NULL,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'migration';

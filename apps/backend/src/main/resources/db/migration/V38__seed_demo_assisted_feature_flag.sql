-- V38: Assisted demo access must be explicitly enabled and never default-open in production.
INSERT INTO feature_flags (id, flag_key, enabled, tenant_id, created_by, updated_by)
SELECT gen_random_uuid(), 'demo.assisted.enabled', FALSE, NULL, 'system', 'system'
WHERE NOT EXISTS (
    SELECT 1
    FROM feature_flags
    WHERE flag_key = 'demo.assisted.enabled'
      AND tenant_id IS NULL
);

-- Harden PET appointment references without inventing a new contract.

INSERT INTO pet_services (
    id,
    tenant_id,
    name,
    description,
    price,
    duration_minutes,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    gen_random_uuid(),
    a.tenant_id,
    COALESCE(NULLIF(TRIM(a.service_name), ''), 'General Service'),
    'Recovered from legacy appointment integrity hardening',
    0.00,
    60,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'system',
    'system'
FROM pet_appointments a
LEFT JOIN pet_services s
    ON s.tenant_id = a.tenant_id
   AND s.name = COALESCE(NULLIF(TRIM(a.service_name), ''), 'General Service')
WHERE a.service_id IS NULL
  AND s.id IS NULL
GROUP BY a.tenant_id, COALESCE(NULLIF(TRIM(a.service_name), ''), 'General Service');

UPDATE pet_appointments a
SET service_id = s.id
FROM pet_services s
WHERE s.tenant_id = a.tenant_id
  AND s.name = COALESCE(NULLIF(TRIM(a.service_name), ''), 'General Service')
  AND a.service_id IS NULL;

ALTER TABLE pet_appointments
    ALTER COLUMN service_id SET NOT NULL;

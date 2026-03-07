-- Optional PET sample seed for local development.

INSERT INTO pet_clients (
    id,
    tenant_id,
    full_name,
    name,
    email,
    phone,
    document,
    status,
    created_by,
    updated_by
)
SELECT
    '77777777-0000-0000-0000-000000000001',
    t.id,
    'Ana Martins',
    'Ana Martins',
    'ana.martins@pet.seed.local',
    '+5511988881111',
    'CPF-ANA-001',
    'ACTIVE',
    'seed',
    'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM pet_clients c
      WHERE c.tenant_id = t.id
        AND c.email = 'ana.martins@pet.seed.local'
  );

INSERT INTO pet_clients (
    id,
    tenant_id,
    full_name,
    name,
    email,
    phone,
    document,
    status,
    created_by,
    updated_by
)
SELECT
    '77777777-0000-0000-0000-000000000002',
    t.id,
    'Carlos Souza',
    'Carlos Souza',
    'carlos.souza@pet.seed.local',
    '+5511977772222',
    'CPF-CARLOS-002',
    'ACTIVE',
    'seed',
    'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM pet_clients c
      WHERE c.tenant_id = t.id
        AND c.email = 'carlos.souza@pet.seed.local'
  );

INSERT INTO pet_profiles (
    id,
    tenant_id,
    client_id,
    name,
    species,
    breed,
    birth_date,
    gender,
    weight,
    notes,
    created_by,
    updated_by
)
SELECT
    '88888888-0000-0000-0000-000000000001',
    t.id,
    c.id,
    'Thor',
    'DOG',
    'Labrador',
    '2021-02-10',
    'MALE',
    28.40,
    'Friendly and active',
    'seed',
    'seed'
FROM tenants t
JOIN pet_clients c ON c.tenant_id = t.id AND c.email = 'ana.martins@pet.seed.local'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM pet_profiles p
      WHERE p.tenant_id = t.id
        AND p.client_id = c.id
        AND p.name = 'Thor'
  );

INSERT INTO pet_profiles (
    id,
    tenant_id,
    client_id,
    name,
    species,
    breed,
    birth_date,
    gender,
    weight,
    notes,
    created_by,
    updated_by
)
SELECT
    '88888888-0000-0000-0000-000000000002',
    t.id,
    c.id,
    'Luna',
    'CAT',
    'Siamese',
    '2022-08-21',
    'FEMALE',
    4.20,
    'Indoor cat',
    'seed',
    'seed'
FROM tenants t
JOIN pet_clients c ON c.tenant_id = t.id AND c.email = 'carlos.souza@pet.seed.local'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM pet_profiles p
      WHERE p.tenant_id = t.id
        AND p.client_id = c.id
        AND p.name = 'Luna'
  );

INSERT INTO pet_appointments (
    id,
    tenant_id,
    client_id,
    pet_id,
    scheduled_at,
    service_name,
    status,
    notes,
    assigned_user_id,
    created_by,
    updated_by
)
SELECT
    '99999999-0000-0000-0000-000000000001',
    t.id,
    c.id,
    p.id,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    'Vaccination',
    'SCHEDULED',
    'First dose reminder',
    u.id,
    'seed',
    'seed'
FROM tenants t
JOIN users u ON u.email = 'admin@local.test'
JOIN pet_clients c ON c.tenant_id = t.id AND c.email = 'ana.martins@pet.seed.local'
JOIN pet_profiles p ON p.tenant_id = t.id AND p.client_id = c.id AND p.name = 'Thor'
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM pet_appointments a
      WHERE a.tenant_id = t.id
        AND a.pet_id = p.id
        AND a.service_name = 'Vaccination'
  );

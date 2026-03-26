-- Phase 26: Pet module demo enrichment seed
-- Adds pet professionals, services, clients, profiles, plans and appointments
-- for the default demo tenant so pet dashboards show meaningful business states.
-- All inserts are idempotent (NOT EXISTS guards).
--
-- UUID namespace: de[group]0000-0000-0000-0000-000000000[seq]
--   de100000-... professionals
--   de200000-... services
--   de300000-... clients
--   de400000-... profiles
--   de500000-... plans
--   de600000-... appointments

-- ─── Pet Professionals ───────────────────────────────────────────────────────

-- Carla Mendes — Banho e Tosa, 15% commission
INSERT INTO pet_professionals (id, tenant_id, name, specialty, commission_rate, created_by, updated_by)
SELECT
    'de100000-0000-0000-0000-000000000001',
    t.id,
    'Carla Mendes', 'Banho e Tosa', 0.1500,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_professionals p
      WHERE p.id = 'de100000-0000-0000-0000-000000000001'
  );

-- Rafael Lima — Tosa Higiênica, 12% commission
INSERT INTO pet_professionals (id, tenant_id, name, specialty, commission_rate, created_by, updated_by)
SELECT
    'de100000-0000-0000-0000-000000000002',
    t.id,
    'Rafael Lima', 'Tosa Higiênica', 0.1200,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_professionals p
      WHERE p.id = 'de100000-0000-0000-0000-000000000002'
  );

-- ─── Pet Service Catalog ─────────────────────────────────────────────────────

-- Banho e Tosa — R$ 80,00
INSERT INTO pet_services (id, tenant_id, name, price, created_by, updated_by)
SELECT
    'de200000-0000-0000-0000-000000000001',
    t.id,
    'Banho e Tosa', 80.00,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_services s
      WHERE s.id = 'de200000-0000-0000-0000-000000000001'
  );

-- Banho e Tosa Higiênica — R$ 100,00
INSERT INTO pet_services (id, tenant_id, name, price, created_by, updated_by)
SELECT
    'de200000-0000-0000-0000-000000000002',
    t.id,
    'Banho e Tosa Higiênica', 100.00,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_services s
      WHERE s.id = 'de200000-0000-0000-0000-000000000002'
  );

-- Somente Tosa — R$ 60,00
INSERT INTO pet_services (id, tenant_id, name, price, created_by, updated_by)
SELECT
    'de200000-0000-0000-0000-000000000003',
    t.id,
    'Somente Tosa', 60.00,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_services s
      WHERE s.id = 'de200000-0000-0000-0000-000000000003'
  );

-- Somente Banho — R$ 50,00
INSERT INTO pet_services (id, tenant_id, name, price, created_by, updated_by)
SELECT
    'de200000-0000-0000-0000-000000000004',
    t.id,
    'Somente Banho', 50.00,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_services s
      WHERE s.id = 'de200000-0000-0000-0000-000000000004'
  );

-- ─── Pet Clients ─────────────────────────────────────────────────────────────

-- Marcos Andrade
INSERT INTO pet_clients (id, tenant_id, full_name, name, phone, status, created_by, updated_by)
SELECT
    'de300000-0000-0000-0000-000000000001',
    t.id,
    'Marcos Andrade', 'Marcos Andrade', '(11) 91234-5678', 'ACTIVE',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_clients c
      WHERE c.id = 'de300000-0000-0000-0000-000000000001'
  );

-- Fernanda Costa
INSERT INTO pet_clients (id, tenant_id, full_name, name, phone, status, created_by, updated_by)
SELECT
    'de300000-0000-0000-0000-000000000002',
    t.id,
    'Fernanda Costa', 'Fernanda Costa', '(11) 99876-5432', 'ACTIVE',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_clients c
      WHERE c.id = 'de300000-0000-0000-0000-000000000002'
  );

-- ─── Pet Profiles ─────────────────────────────────────────────────────────────

-- Rex — dono: Marcos Andrade
INSERT INTO pet_profiles (id, tenant_id, client_id, name, species, breed, weight, gender, created_by, updated_by)
SELECT
    'de400000-0000-0000-0000-000000000001',
    t.id,
    'de300000-0000-0000-0000-000000000001',
    'Rex', 'DOG', 'Golden Retriever', 32.00, 'MALE',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_profiles p
      WHERE p.id = 'de400000-0000-0000-0000-000000000001'
  );

-- Mel — dona: Fernanda Costa
INSERT INTO pet_profiles (id, tenant_id, client_id, name, species, breed, weight, gender, created_by, updated_by)
SELECT
    'de400000-0000-0000-0000-000000000002',
    t.id,
    'de300000-0000-0000-0000-000000000002',
    'Mel', 'DOG', 'Shih Tzu', 5.00, 'FEMALE',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_profiles p
      WHERE p.id = 'de400000-0000-0000-0000-000000000002'
  );

-- ─── Pet Client Plans ─────────────────────────────────────────────────────────

-- Plano de Marcos: 4 sessões, 3 usadas (estado crítico para demo)
INSERT INTO pet_client_plans (id, tenant_id, client_id, plan_name, total_sessions, used_sessions, created_by, updated_by)
SELECT
    'de500000-0000-0000-0000-000000000001',
    t.id,
    'de300000-0000-0000-0000-000000000001',
    'Plano Mensal Banho e Tosa', 4, 3,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_client_plans p
      WHERE p.id = 'de500000-0000-0000-0000-000000000001'
  );

-- Plano de Fernanda: 8 sessões, 2 usadas
INSERT INTO pet_client_plans (id, tenant_id, client_id, plan_name, total_sessions, used_sessions, created_by, updated_by)
SELECT
    'de500000-0000-0000-0000-000000000002',
    t.id,
    'de300000-0000-0000-0000-000000000002',
    'Plano Mensal Banho', 8, 2,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_client_plans p
      WHERE p.id = 'de500000-0000-0000-0000-000000000002'
  );

-- ─── Pet Appointments ─────────────────────────────────────────────────────────

-- Rex com Carla Mendes — SCHEDULED, amanhã, vinculado ao plano do Marcos
-- commission_amount = 80.00 * 0.15 = 12.00
INSERT INTO pet_appointments (
    id, tenant_id, pet_id, client_id, professional_id, service_id, service_name,
    scheduled_at, status, service_price, commission_amount,
    client_plan_id, plan_session_consumed,
    created_by, updated_by
)
SELECT
    'de600000-0000-0000-0000-000000000001',
    t.id,
    'de400000-0000-0000-0000-000000000001',
    'de300000-0000-0000-0000-000000000001',
    'de100000-0000-0000-0000-000000000001',
    'de200000-0000-0000-0000-000000000001',
    'Banho e Tosa',
    NOW() + INTERVAL '1 day', 'SCHEDULED',
    80.00, 12.00,
    'de500000-0000-0000-0000-000000000001', false,
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_appointments a
      WHERE a.id = 'de600000-0000-0000-0000-000000000001'
  );

-- Mel com Rafael Lima — COMPLETED, 2 horas atrás, sem plano, com extras (Pet taxi)
-- commission_amount = 50.00 * 0.12 = 6.00
INSERT INTO pet_appointments (
    id, tenant_id, pet_id, client_id, professional_id, service_id, service_name,
    scheduled_at, status, service_price, commission_amount,
    plan_session_consumed, extras_amount, extras_description,
    created_by, updated_by
)
SELECT
    'de600000-0000-0000-0000-000000000002',
    t.id,
    'de400000-0000-0000-0000-000000000002',
    'de300000-0000-0000-0000-000000000002',
    'de100000-0000-0000-0000-000000000002',
    'de200000-0000-0000-0000-000000000004',
    'Somente Banho',
    NOW() - INTERVAL '2 hours', 'COMPLETED',
    50.00, 6.00,
    false, 15.00, 'Pet taxi',
    'demo', 'demo'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM pet_appointments a
      WHERE a.id = 'de600000-0000-0000-0000-000000000002'
  );

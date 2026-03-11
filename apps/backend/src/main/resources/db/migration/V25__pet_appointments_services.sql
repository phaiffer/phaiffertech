-- PET V1 service catalog, professionals and appointment references.

CREATE TABLE pet_services (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INT NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_services_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE INDEX idx_pet_services_tenant_name ON pet_services (tenant_id, name);

CREATE TABLE pet_professionals (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    specialty VARCHAR(120) NULL,
    license_number VARCHAR(80) NULL,
    phone VARCHAR(40) NULL,
    email VARCHAR(180) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_professionals_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE INDEX idx_pet_professionals_name ON pet_professionals (tenant_id, name);
CREATE INDEX idx_pet_professionals_license ON pet_professionals (tenant_id, license_number);

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
    'Migrated from existing appointment history',
    0.00,
    60,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'system',
    'system'
FROM pet_appointments a
WHERE a.deleted_at IS NULL
GROUP BY a.tenant_id, COALESCE(NULLIF(TRIM(a.service_name), ''), 'General Service');

ALTER TABLE pet_appointments
    ADD COLUMN service_id UUID NULL,
    ADD COLUMN professional_id UUID NULL;

UPDATE pet_appointments a
SET service_id = s.id
FROM pet_services s
WHERE s.tenant_id = a.tenant_id
  AND s.name = COALESCE(NULLIF(TRIM(a.service_name), ''), 'General Service')
  AND a.service_id IS NULL;

ALTER TABLE pet_appointments
    ADD CONSTRAINT fk_pet_appointments_service FOREIGN KEY (service_id) REFERENCES pet_services (id),
    ADD CONSTRAINT fk_pet_appointments_professional FOREIGN KEY (professional_id) REFERENCES pet_professionals (id);

CREATE INDEX idx_pet_appointments_service ON pet_appointments (tenant_id, service_id);
CREATE INDEX idx_pet_appointments_professional ON pet_appointments (tenant_id, professional_id);

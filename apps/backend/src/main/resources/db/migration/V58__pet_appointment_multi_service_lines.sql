CREATE TABLE pet_appointment_services (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    appointment_id UUID NOT NULL,
    service_id UUID NOT NULL,
    line_order INTEGER NOT NULL,
    service_name VARCHAR(120) NOT NULL,
    service_category VARCHAR(30) NULL,
    duration_minutes INTEGER NULL,
    service_price NUMERIC(10, 2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_appointment_services_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_appointment_services_appointment FOREIGN KEY (appointment_id) REFERENCES pet_appointments (id),
    CONSTRAINT fk_pet_appointment_services_service FOREIGN KEY (service_id) REFERENCES pet_services (id),
    CONSTRAINT uq_pet_appointment_services_line UNIQUE (appointment_id, line_order),
    CONSTRAINT uq_pet_appointment_services_service UNIQUE (appointment_id, service_id),
    CONSTRAINT chk_pet_appointment_services_line_order CHECK (line_order >= 0),
    CONSTRAINT chk_pet_appointment_services_category CHECK (
        service_category IS NULL OR service_category IN ('GROOMING', 'CLINICAL')
    )
);

INSERT INTO pet_appointment_services (
    id,
    tenant_id,
    appointment_id,
    service_id,
    line_order,
    service_name,
    service_category,
    duration_minutes,
    service_price,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at
)
SELECT
    gen_random_uuid(),
    a.tenant_id,
    a.id,
    a.service_id,
    0,
    a.service_name,
    s.category,
    s.duration_minutes,
    a.service_price,
    COALESCE(a.created_at, CURRENT_TIMESTAMP),
    COALESCE(a.updated_at, CURRENT_TIMESTAMP),
    COALESCE(a.created_by, 'system'),
    COALESCE(a.updated_by, 'system'),
    a.deleted_at
FROM pet_appointments a
LEFT JOIN pet_services s
    ON s.id = a.service_id
   AND s.tenant_id = a.tenant_id
WHERE a.service_id IS NOT NULL;

CREATE INDEX idx_pet_appointment_services_tenant_appointment
    ON pet_appointment_services (tenant_id, appointment_id, line_order);

CREATE INDEX idx_pet_appointment_services_tenant_service
    ON pet_appointment_services (tenant_id, service_id);

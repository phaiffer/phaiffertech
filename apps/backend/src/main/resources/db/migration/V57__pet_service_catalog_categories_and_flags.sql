ALTER TABLE pet_services
    ADD COLUMN category VARCHAR(30) NOT NULL DEFAULT 'GROOMING',
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN commission_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN allow_in_plans BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN allow_standalone_booking BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE pet_services s
SET category = CASE
    WHEN t.plan_code IN ('BANHO_TOSA', 'PETSHOP_BANHO_TOSA') THEN 'GROOMING'
    WHEN t.plan_code = 'CLINICA_VETERINARIA' THEN 'CLINICAL'
    WHEN LOWER(COALESCE(s.name, '')) ~ '(consulta|consultation|retorno|return visit|vacina|vaccin|medica|medicat|curativo|wound|proced|cirurg|exam|interna)' THEN 'CLINICAL'
    ELSE 'GROOMING'
END
FROM tenants t
WHERE t.id = s.tenant_id;

ALTER TABLE pet_services
    ADD CONSTRAINT chk_pet_services_category
        CHECK (category IN ('GROOMING', 'CLINICAL'));

CREATE INDEX idx_pet_services_tenant_category_active
    ON pet_services (tenant_id, category, active);

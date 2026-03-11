-- PET V1 medical records, vaccinations and prescriptions.

CREATE TABLE pet_medical_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    pet_id UUID NOT NULL,
    professional_id UUID NOT NULL,
    description TEXT NOT NULL,
    diagnosis TEXT NULL,
    treatment TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_medical_records_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_medical_records_pet FOREIGN KEY (pet_id) REFERENCES pet_profiles (id),
    CONSTRAINT fk_pet_medical_records_professional FOREIGN KEY (professional_id) REFERENCES pet_professionals (id)
);

CREATE INDEX idx_pet_medical_records_pet ON pet_medical_records (tenant_id, pet_id, created_at);
CREATE INDEX idx_pet_medical_records_professional ON pet_medical_records (tenant_id, professional_id);

CREATE TABLE pet_vaccinations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    pet_id UUID NOT NULL,
    vaccine_name VARCHAR(150) NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL,
    next_due_at TIMESTAMPTZ NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_vaccinations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_vaccinations_pet FOREIGN KEY (pet_id) REFERENCES pet_profiles (id)
);

CREATE INDEX idx_pet_vaccinations_pet_due ON pet_vaccinations (tenant_id, pet_id, next_due_at);
CREATE INDEX idx_pet_vaccinations_name ON pet_vaccinations (tenant_id, vaccine_name);

CREATE TABLE pet_prescriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    pet_id UUID NOT NULL,
    professional_id UUID NOT NULL,
    medication VARCHAR(180) NOT NULL,
    dosage VARCHAR(120) NULL,
    instructions TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_prescriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_prescriptions_pet FOREIGN KEY (pet_id) REFERENCES pet_profiles (id),
    CONSTRAINT fk_pet_prescriptions_professional FOREIGN KEY (professional_id) REFERENCES pet_professionals (id)
);

CREATE INDEX idx_pet_prescriptions_pet ON pet_prescriptions (tenant_id, pet_id, created_at);
CREATE INDEX idx_pet_prescriptions_professional ON pet_prescriptions (tenant_id, professional_id);

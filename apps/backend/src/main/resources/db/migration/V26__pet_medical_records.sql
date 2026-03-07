-- PET V1 medical records, vaccinations and prescriptions.

CREATE TABLE pet_medical_records (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    pet_id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    description TEXT NOT NULL,
    diagnosis TEXT NULL,
    treatment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pet_medical_records_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_medical_records_pet FOREIGN KEY (pet_id) REFERENCES pet_profiles (id),
    CONSTRAINT fk_pet_medical_records_professional FOREIGN KEY (professional_id) REFERENCES pet_professionals (id),
    INDEX idx_pet_medical_records_pet (tenant_id, pet_id, created_at),
    INDEX idx_pet_medical_records_professional (tenant_id, professional_id)
);

CREATE TABLE pet_vaccinations (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    pet_id CHAR(36) NOT NULL,
    vaccine_name VARCHAR(150) NOT NULL,
    applied_at TIMESTAMP NOT NULL,
    next_due_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pet_vaccinations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_vaccinations_pet FOREIGN KEY (pet_id) REFERENCES pet_profiles (id),
    INDEX idx_pet_vaccinations_pet_due (tenant_id, pet_id, next_due_at),
    INDEX idx_pet_vaccinations_name (tenant_id, vaccine_name)
);

CREATE TABLE pet_prescriptions (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    pet_id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    medication VARCHAR(180) NOT NULL,
    dosage VARCHAR(120) NULL,
    instructions TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pet_prescriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_prescriptions_pet FOREIGN KEY (pet_id) REFERENCES pet_profiles (id),
    CONSTRAINT fk_pet_prescriptions_professional FOREIGN KEY (professional_id) REFERENCES pet_professionals (id),
    INDEX idx_pet_prescriptions_pet (tenant_id, pet_id, created_at),
    INDEX idx_pet_prescriptions_professional (tenant_id, professional_id)
);

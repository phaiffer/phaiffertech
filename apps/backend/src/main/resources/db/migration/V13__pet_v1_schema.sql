-- PET v1 schema evolution.

ALTER TABLE pet_clients
    ADD COLUMN name VARCHAR(150) NULL AFTER tenant_id,
    ADD COLUMN document VARCHAR(60) NULL AFTER phone,
    ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE' AFTER document;

UPDATE pet_clients
SET name = full_name
WHERE name IS NULL;

ALTER TABLE pet_clients
    MODIFY COLUMN name VARCHAR(150) NOT NULL;

CREATE INDEX idx_pet_clients_name_status ON pet_clients (tenant_id, name, status);
CREATE INDEX idx_pet_clients_document ON pet_clients (tenant_id, document);

ALTER TABLE pet_profiles
    ADD COLUMN gender VARCHAR(30) NULL AFTER birth_date,
    ADD COLUMN weight DECIMAL(10,2) NULL AFTER gender,
    ADD COLUMN notes TEXT NULL AFTER weight;

CREATE INDEX idx_pet_profiles_species_breed ON pet_profiles (tenant_id, species, breed);

ALTER TABLE pet_appointments
    ADD COLUMN client_id CHAR(36) NULL AFTER tenant_id,
    ADD COLUMN service_name VARCHAR(120) NOT NULL DEFAULT 'GENERAL' AFTER scheduled_at,
    ADD COLUMN assigned_user_id CHAR(36) NULL AFTER notes;

UPDATE pet_appointments a
JOIN pet_profiles p ON p.id = a.pet_id
SET a.client_id = p.client_id
WHERE a.client_id IS NULL;

ALTER TABLE pet_appointments
    MODIFY COLUMN client_id CHAR(36) NOT NULL;

ALTER TABLE pet_appointments
    ADD CONSTRAINT fk_pet_appointments_client FOREIGN KEY (client_id) REFERENCES pet_clients (id),
    ADD CONSTRAINT fk_pet_appointments_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users (id);

CREATE INDEX idx_pet_appointments_client_status ON pet_appointments (tenant_id, client_id, status);
CREATE INDEX idx_pet_appointments_assigned_user ON pet_appointments (tenant_id, assigned_user_id);

-- PET v1 schema evolution.

ALTER TABLE pet_clients
    ADD COLUMN name VARCHAR(150) NULL,
    ADD COLUMN document VARCHAR(60) NULL,
    ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE';

UPDATE pet_clients
SET name = full_name
WHERE name IS NULL;

ALTER TABLE pet_clients
    ALTER COLUMN name SET NOT NULL;

CREATE INDEX idx_pet_clients_name_status ON pet_clients (tenant_id, name, status);
CREATE INDEX idx_pet_clients_document ON pet_clients (tenant_id, document);

ALTER TABLE pet_profiles
    ADD COLUMN gender VARCHAR(30) NULL,
    ADD COLUMN weight DECIMAL(10,2) NULL,
    ADD COLUMN notes TEXT NULL;

CREATE INDEX idx_pet_profiles_species_breed ON pet_profiles (tenant_id, species, breed);

ALTER TABLE pet_appointments
    ADD COLUMN client_id UUID NULL,
    ADD COLUMN service_name VARCHAR(120) NOT NULL DEFAULT 'GENERAL',
    ADD COLUMN assigned_user_id UUID NULL;

UPDATE pet_appointments a
SET client_id = p.client_id
FROM pet_profiles p
WHERE p.id = a.pet_id
  AND a.client_id IS NULL;

ALTER TABLE pet_appointments
    ALTER COLUMN client_id SET NOT NULL;

ALTER TABLE pet_appointments
    ADD CONSTRAINT fk_pet_appointments_client FOREIGN KEY (client_id) REFERENCES pet_clients (id),
    ADD CONSTRAINT fk_pet_appointments_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users (id);

CREATE INDEX idx_pet_appointments_client_status ON pet_appointments (tenant_id, client_id, status);
CREATE INDEX idx_pet_appointments_assigned_user ON pet_appointments (tenant_id, assigned_user_id);

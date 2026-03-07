-- PET V1 expansion for client and pet profiles.

ALTER TABLE pet_clients
    ADD COLUMN address VARCHAR(255) NULL AFTER document;

CREATE INDEX idx_pet_clients_address ON pet_clients (tenant_id, address);

ALTER TABLE pet_profiles
    ADD COLUMN color VARCHAR(80) NULL AFTER weight;

CREATE INDEX idx_pet_profiles_color ON pet_profiles (tenant_id, color);

-- PetFlow Sprint 1 grooming profile fields.

ALTER TABLE pet_clients
    ADD COLUMN notes TEXT NULL;

ALTER TABLE pet_profiles
    ADD COLUMN size VARCHAR(30) NULL,
    ADD COLUMN coat_type VARCHAR(80) NULL,
    ADD COLUMN behavior VARCHAR(80) NULL,
    ADD COLUMN restrictions TEXT NULL,
    ADD COLUMN grooming_notes TEXT NULL;

CREATE INDEX idx_pet_profiles_grooming_profile ON pet_profiles (tenant_id, size, coat_type);

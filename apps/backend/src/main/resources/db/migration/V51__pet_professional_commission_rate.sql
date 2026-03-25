ALTER TABLE pet_professionals
    ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 4) NULL;

UPDATE tenants
SET status = UPPER(BTRIM(status));

ALTER TABLE tenants
    ALTER COLUMN status SET DEFAULT 'ACTIVE';

ALTER TABLE tenants
    DROP CONSTRAINT IF EXISTS ck_tenants_status_valid;

ALTER TABLE tenants
    ADD CONSTRAINT ck_tenants_status_valid
        CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'));

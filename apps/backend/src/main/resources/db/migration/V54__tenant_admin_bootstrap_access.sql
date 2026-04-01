ALTER TABLE tenants
    ADD COLUMN trial_end_date DATE NULL;

ALTER TABLE users
    ADD COLUMN require_password_change_on_first_access BOOLEAN NOT NULL DEFAULT FALSE;

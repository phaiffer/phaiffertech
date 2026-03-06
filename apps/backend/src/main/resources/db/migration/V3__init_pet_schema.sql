-- PET schema hardening and query performance indexes.
ALTER TABLE pet_clients
    ADD INDEX idx_pet_clients_email (tenant_id, email);

ALTER TABLE pet_profiles
    ADD INDEX idx_pet_profiles_client (tenant_id, client_id);

ALTER TABLE pet_appointments
    ADD INDEX idx_pet_appointments_pet_status (tenant_id, pet_id, status),
    ADD INDEX idx_pet_appointments_scheduled_at (tenant_id, scheduled_at);

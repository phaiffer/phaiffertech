-- PET schema hardening and query performance indexes.

CREATE INDEX idx_pet_clients_email ON pet_clients (tenant_id, email);
CREATE INDEX idx_pet_profiles_client ON pet_profiles (tenant_id, client_id);
CREATE INDEX idx_pet_appointments_pet_status ON pet_appointments (tenant_id, pet_id, status);
CREATE INDEX idx_pet_appointments_scheduled_at ON pet_appointments (tenant_id, scheduled_at);

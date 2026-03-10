-- PET clinical workflow can optionally reference the source appointment.

ALTER TABLE pet_medical_records
    ADD COLUMN appointment_id CHAR(36) NULL AFTER professional_id,
    ADD CONSTRAINT fk_pet_medical_records_appointment FOREIGN KEY (appointment_id) REFERENCES pet_appointments (id);

ALTER TABLE pet_vaccinations
    ADD COLUMN appointment_id CHAR(36) NULL AFTER pet_id,
    ADD CONSTRAINT fk_pet_vaccinations_appointment FOREIGN KEY (appointment_id) REFERENCES pet_appointments (id);

ALTER TABLE pet_prescriptions
    ADD COLUMN appointment_id CHAR(36) NULL AFTER professional_id,
    ADD CONSTRAINT fk_pet_prescriptions_appointment FOREIGN KEY (appointment_id) REFERENCES pet_appointments (id);

CREATE INDEX idx_pet_medical_records_appointment ON pet_medical_records (tenant_id, appointment_id, created_at);
CREATE INDEX idx_pet_vaccinations_appointment ON pet_vaccinations (tenant_id, appointment_id, applied_at);
CREATE INDEX idx_pet_prescriptions_appointment ON pet_prescriptions (tenant_id, appointment_id, created_at);

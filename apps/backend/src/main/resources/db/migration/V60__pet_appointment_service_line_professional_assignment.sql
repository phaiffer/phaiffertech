ALTER TABLE pet_appointment_services
    ADD COLUMN IF NOT EXISTS professional_id UUID NULL,
    ADD COLUMN IF NOT EXISTS professional_name VARCHAR(150) NULL;

COMMENT ON COLUMN pet_appointment_services.professional_id IS
    'Responsible professional assigned to this appointment service line. Null when the operation has not assigned line-level ownership yet.';

COMMENT ON COLUMN pet_appointment_services.professional_name IS
    'Professional name snapshot stored on the appointment service line so historical bookings remain readable even after roster changes.';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_pet_appointment_services_professional'
    ) THEN
        ALTER TABLE pet_appointment_services
            ADD CONSTRAINT fk_pet_appointment_services_professional
                FOREIGN KEY (professional_id) REFERENCES pet_professionals (id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pet_appointment_services_tenant_professional
    ON pet_appointment_services (tenant_id, professional_id);

UPDATE pet_appointment_services line
SET professional_id = appointment.professional_id,
    professional_name = professional.name
FROM pet_appointments appointment
LEFT JOIN pet_professionals professional
    ON professional.id = appointment.professional_id
   AND professional.tenant_id = appointment.tenant_id
WHERE appointment.id = line.appointment_id
  AND appointment.tenant_id = line.tenant_id
  AND (line.professional_id IS NULL OR line.professional_name IS NULL);

ALTER TABLE pet_appointment_services
    ADD COLUMN IF NOT EXISTS commission_eligible BOOLEAN NULL,
    ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 4) NULL,
    ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10, 2) NULL;

COMMENT ON COLUMN pet_appointment_services.commission_eligible IS
    'Service-line commission gate snapshot. Null only for legacy rows that predate the structured commission rollout.';

COMMENT ON COLUMN pet_appointment_services.commission_rate IS
    'Commission rate snapshot applied to this service line at booking or update time when the selected service allows commission.';

COMMENT ON COLUMN pet_appointment_services.commission_amount IS
    'Projected commission amount for this service line. Null when the service is not commission-eligible or the professional has no commission rate.';

UPDATE pet_appointment_services line
SET commission_eligible = service.commission_eligible
FROM pet_services service
WHERE service.id = line.service_id
  AND service.tenant_id = line.tenant_id
  AND line.commission_eligible IS NULL;

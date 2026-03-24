-- Phase 24B: Appointment professional enforcement and service price snapshot
-- Adds service_price (snapshot from service catalog at booking time)
-- and commission_amount (reserved for future commission model, always null in this phase)

ALTER TABLE pet_appointments
    ADD COLUMN IF NOT EXISTS service_price     DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2);

COMMENT ON COLUMN pet_appointments.service_price IS
    'Price snapshot taken from the service catalog at the time of booking. '
    'Immutable after creation unless explicitly overridden by the operator.';

COMMENT ON COLUMN pet_appointments.commission_amount IS
    'Reserved for commission calculation. Null until a professional commission model is established.';

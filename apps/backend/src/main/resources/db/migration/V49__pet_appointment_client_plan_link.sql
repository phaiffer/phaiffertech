-- V49: Link pet appointments to client plans for session-based grooming packages.
-- Adds an optional reference from an appointment to the plan it consumes,
-- and a flag to prevent double-session consumption on repeated updates.

ALTER TABLE pet_appointments
    ADD COLUMN IF NOT EXISTS client_plan_id   UUID    NULL,
    ADD COLUMN IF NOT EXISTS plan_session_consumed BOOLEAN NOT NULL DEFAULT FALSE;

-- Informational FK — not enforced with a hard constraint to allow plan deletion without blocking appointments.
-- The application layer validates plan existence and tenant scope before linking.
COMMENT ON COLUMN pet_appointments.client_plan_id IS
    'Optional reference to the client plan used for this appointment. NULL for one-time paid appointments.';

COMMENT ON COLUMN pet_appointments.plan_session_consumed IS
    'TRUE once the plan session has been consumed. Prevents double-consumption on repeated COMPLETED status updates.';

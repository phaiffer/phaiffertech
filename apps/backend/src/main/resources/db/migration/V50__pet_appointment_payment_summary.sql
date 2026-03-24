-- V50: Add extras support and checkout summary to pet appointments.
-- extrasAmount: optional additional charges on top of the base service
--   (e.g. pet taxi, grooming add-ons, manual adjustments).
-- extras_description: free text describing what is included in the extras.
-- final_amount_due is intentionally NOT stored — it is always computed as:
--   planSessionConsumed=true  -> extrasAmount (service covered by plan)
--   planSessionConsumed=false -> servicePrice + extrasAmount

ALTER TABLE pet_appointments
    ADD COLUMN IF NOT EXISTS extras_amount      NUMERIC(10, 2) NULL,
    ADD COLUMN IF NOT EXISTS extras_description TEXT           NULL;

COMMENT ON COLUMN pet_appointments.extras_amount IS
    'Optional extra charges beyond the base service price (e.g. pet taxi, add-ons). NULL means no extras.';

COMMENT ON COLUMN pet_appointments.extras_description IS
    'Human-readable label for the extras (e.g. "Pet taxi + nail trim"). NULL when no extras exist.';

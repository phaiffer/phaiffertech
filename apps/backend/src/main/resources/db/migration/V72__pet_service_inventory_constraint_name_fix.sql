-- V62 and V63 declared check constraints whose names exceed PostgreSQL's
-- 63-character identifier limit, so they were stored truncated
-- ("..._positiv" and "..._non_negat"). Rename them to names that fit.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'pet_appointment_service_inventory'::regclass
          AND conname = 'chk_pet_appointment_service_inventory_expected_quantity_positiv'
    ) THEN
        ALTER TABLE pet_appointment_service_inventory
            RENAME CONSTRAINT chk_pet_appointment_service_inventory_expected_quantity_positiv
            TO chk_pet_appt_service_inventory_expected_qty_positive;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'pet_appointment_service_inventory'::regclass
          AND conname = 'chk_pet_appointment_service_inventory_actual_quantity_non_negat'
    ) THEN
        ALTER TABLE pet_appointment_service_inventory
            RENAME CONSTRAINT chk_pet_appointment_service_inventory_actual_quantity_non_negat
            TO chk_pet_appt_service_inventory_actual_qty_non_negative;
    END IF;
END $$;

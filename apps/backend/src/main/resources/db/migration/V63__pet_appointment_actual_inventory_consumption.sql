ALTER TABLE pet_appointment_service_inventory
    ADD COLUMN actual_quantity NUMERIC(10, 2) NULL,
    ADD COLUMN consumption_status VARCHAR(40) NOT NULL DEFAULT 'PLANNED';

ALTER TABLE pet_appointment_service_inventory
    ADD CONSTRAINT chk_pet_appointment_service_inventory_actual_quantity_non_negative
        CHECK (actual_quantity IS NULL OR actual_quantity >= 0);

ALTER TABLE pet_appointment_service_inventory
    ADD CONSTRAINT chk_pet_appointment_service_inventory_status
        CHECK (consumption_status IN ('PLANNED', 'ADJUSTED', 'READY_TO_APPLY', 'SKIPPED'));

COMMENT ON COLUMN pet_appointment_service_inventory.actual_quantity IS
    'Actual quantity recorded by the operator for this appointment service line. Null until actual usage is captured.';

COMMENT ON COLUMN pet_appointment_service_inventory.consumption_status IS
    'Operational status for the actual consumption workflow. This rollout does not create inventory movements automatically.';

ALTER TABLE pet_appointment_service_inventory
    ADD COLUMN applied_inventory_movement_id UUID NULL,
    ADD COLUMN stock_applied_at TIMESTAMPTZ NULL,
    ADD COLUMN stock_applied_by VARCHAR(64) NULL;

ALTER TABLE pet_appointment_service_inventory
    ADD CONSTRAINT fk_pet_appointment_service_inventory_applied_movement
        FOREIGN KEY (applied_inventory_movement_id) REFERENCES inventory_movements (id);

CREATE INDEX idx_pet_appointment_service_inventory_applied_movement
    ON pet_appointment_service_inventory (tenant_id, applied_inventory_movement_id);

COMMENT ON COLUMN pet_appointment_service_inventory.applied_inventory_movement_id IS
    'Inventory movement created by the explicit stock-application action for this appointment service inventory row.';

COMMENT ON COLUMN pet_appointment_service_inventory.stock_applied_at IS
    'Timestamp when the recorded actual usage was explicitly applied to stock.';

COMMENT ON COLUMN pet_appointment_service_inventory.stock_applied_by IS
    'Operator email captured when the explicit stock-application action was executed.';

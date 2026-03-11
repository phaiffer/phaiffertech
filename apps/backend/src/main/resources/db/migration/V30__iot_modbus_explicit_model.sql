-- IoT explicit Modbus model for device communication and register mapping.

ALTER TABLE iot_devices
    ADD COLUMN transport VARCHAR(40) NULL,
    ADD COLUMN host VARCHAR(120) NULL,
    ADD COLUMN port INT NULL,
    ADD COLUMN unit_id INT NULL,
    ADD COLUMN polling_profile VARCHAR(40) NULL,
    ADD COLUMN gateway VARCHAR(120) NULL;

CREATE INDEX idx_iot_devices_transport_status ON iot_devices (tenant_id, transport, status);

ALTER TABLE iot_registers
    ADD COLUMN function_code VARCHAR(16) NULL,
    ADD COLUMN register_address INT NULL;

UPDATE iot_registers
SET function_code = UPPER(split_part(code, ':', 1)),
    register_address = CAST(split_part(code, ':', 2) AS INTEGER)
WHERE code ~* '^fc[0-9]{2}:[0-9]{1,6}$';

CREATE INDEX idx_iot_registers_modbus_mapping
    ON iot_registers (tenant_id, device_id, function_code, register_address);

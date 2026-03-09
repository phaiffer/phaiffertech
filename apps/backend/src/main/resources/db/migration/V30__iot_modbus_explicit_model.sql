-- IoT explicit Modbus model for device communication and register mapping.

ALTER TABLE iot_devices
    ADD COLUMN transport VARCHAR(40) NULL AFTER description,
    ADD COLUMN host VARCHAR(120) NULL AFTER transport,
    ADD COLUMN port INT NULL AFTER host,
    ADD COLUMN unit_id INT NULL AFTER port,
    ADD COLUMN polling_profile VARCHAR(40) NULL AFTER unit_id,
    ADD COLUMN gateway VARCHAR(120) NULL AFTER polling_profile;

CREATE INDEX idx_iot_devices_transport_status ON iot_devices (tenant_id, transport, status);

ALTER TABLE iot_registers
    ADD COLUMN function_code VARCHAR(16) NULL AFTER code,
    ADD COLUMN register_address INT NULL AFTER function_code;

UPDATE iot_registers
SET function_code = UPPER(SUBSTRING_INDEX(code, ':', 1)),
    register_address = CAST(SUBSTRING_INDEX(code, ':', -1) AS UNSIGNED)
WHERE code REGEXP '^[Ff][Cc][0-9]{2}:[0-9]{1,6}$';

CREATE INDEX idx_iot_registers_modbus_mapping
    ON iot_registers (tenant_id, device_id, function_code, register_address);

-- IoT v1 schema evolution.

ALTER TABLE iot_devices
    ADD COLUMN identifier VARCHAR(100) NULL AFTER name,
    ADD COLUMN type VARCHAR(80) NULL AFTER serial_number,
    ADD COLUMN location VARCHAR(150) NULL AFTER type;

UPDATE iot_devices
SET identifier = serial_number
WHERE identifier IS NULL OR identifier = '';

ALTER TABLE iot_devices
    MODIFY COLUMN identifier VARCHAR(100) NOT NULL;

ALTER TABLE iot_devices
    ADD CONSTRAINT uq_iot_devices_tenant_identifier UNIQUE (tenant_id, identifier);

CREATE INDEX idx_iot_devices_type_status ON iot_devices (tenant_id, type, status);

ALTER TABLE iot_alarms
    ADD COLUMN code VARCHAR(80) NULL AFTER device_id;

UPDATE iot_alarms
SET code = 'THRESHOLD_EXCEEDED'
WHERE code IS NULL OR code = '';

ALTER TABLE iot_alarms
    MODIFY COLUMN code VARCHAR(80) NOT NULL;

ALTER TABLE iot_alarms
    CHANGE COLUMN resolved_at acknowledged_at TIMESTAMP NULL;

CREATE INDEX idx_iot_alarms_device_status ON iot_alarms (tenant_id, device_id, status);
CREATE INDEX idx_iot_alarms_code ON iot_alarms (tenant_id, code);

ALTER TABLE iot_telemetry_records
    CHANGE COLUMN metric metric_name VARCHAR(80) NOT NULL,
    CHANGE COLUMN value metric_value DECIMAL(15,4) NOT NULL,
    ADD COLUMN unit VARCHAR(40) NULL AFTER metric_value,
    ADD COLUMN metadata TEXT NULL AFTER unit;

CREATE INDEX idx_iot_telemetry_device_recorded ON iot_telemetry_records (tenant_id, device_id, recorded_at);
CREATE INDEX idx_iot_telemetry_metric_name ON iot_telemetry_records (tenant_id, metric_name);

-- IoT v1 schema evolution.

ALTER TABLE iot_devices
    ADD COLUMN identifier VARCHAR(100) NULL,
    ADD COLUMN type VARCHAR(80) NULL,
    ADD COLUMN location VARCHAR(150) NULL;

UPDATE iot_devices
SET identifier = serial_number
WHERE identifier IS NULL OR identifier = '';

ALTER TABLE iot_devices
    ALTER COLUMN identifier SET NOT NULL;

ALTER TABLE iot_devices
    ADD CONSTRAINT uq_iot_devices_tenant_identifier UNIQUE (tenant_id, identifier);

CREATE INDEX idx_iot_devices_type_status ON iot_devices (tenant_id, type, status);

ALTER TABLE iot_alarms
    ADD COLUMN code VARCHAR(80) NULL;

UPDATE iot_alarms
SET code = 'THRESHOLD_EXCEEDED'
WHERE code IS NULL OR code = '';

ALTER TABLE iot_alarms
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE iot_alarms
    RENAME COLUMN resolved_at TO acknowledged_at;

CREATE INDEX idx_iot_alarms_device_status ON iot_alarms (tenant_id, device_id, status);
CREATE INDEX idx_iot_alarms_code ON iot_alarms (tenant_id, code);

ALTER TABLE iot_telemetry_records
    RENAME COLUMN metric TO metric_name;

ALTER TABLE iot_telemetry_records
    RENAME COLUMN value TO metric_value;

ALTER TABLE iot_telemetry_records
    ALTER COLUMN metric_name TYPE VARCHAR(80),
    ALTER COLUMN metric_name SET NOT NULL,
    ALTER COLUMN metric_value TYPE DECIMAL(15,4),
    ALTER COLUMN metric_value SET NOT NULL,
    ADD COLUMN unit VARCHAR(40) NULL,
    ADD COLUMN metadata TEXT NULL;

CREATE INDEX idx_iot_telemetry_device_recorded ON iot_telemetry_records (tenant_id, device_id, recorded_at);
CREATE INDEX idx_iot_telemetry_metric_name ON iot_telemetry_records (tenant_id, metric_name);

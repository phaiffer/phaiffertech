-- IoT V1 data plane pragmatism for telemetry and alarms.

ALTER TABLE iot_telemetry_records
    ADD COLUMN register_id CHAR(36) NULL AFTER device_id;

ALTER TABLE iot_telemetry_records
    ADD CONSTRAINT fk_iot_telemetry_register FOREIGN KEY (register_id) REFERENCES iot_registers (id);

CREATE INDEX idx_iot_telemetry_register_recorded ON iot_telemetry_records (tenant_id, register_id, recorded_at);
CREATE INDEX idx_iot_telemetry_device_metric_recorded ON iot_telemetry_records (tenant_id, device_id, metric_name, recorded_at);

ALTER TABLE iot_alarms
    ADD COLUMN register_id CHAR(36) NULL AFTER device_id,
    ADD COLUMN acknowledged_by CHAR(36) NULL AFTER acknowledged_at;

ALTER TABLE iot_alarms
    ADD CONSTRAINT fk_iot_alarms_register FOREIGN KEY (register_id) REFERENCES iot_registers (id);

CREATE INDEX idx_iot_alarms_register_status ON iot_alarms (tenant_id, register_id, status);
CREATE INDEX idx_iot_alarms_acknowledged_by ON iot_alarms (tenant_id, acknowledged_by);

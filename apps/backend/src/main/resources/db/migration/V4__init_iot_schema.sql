-- IoT schema hardening and query performance indexes.
ALTER TABLE iot_devices
    ADD INDEX idx_iot_devices_status (tenant_id, status);

ALTER TABLE iot_telemetry_records
    ADD INDEX idx_iot_telemetry_recorded_at (tenant_id, recorded_at);

ALTER TABLE iot_alarms
    ADD INDEX idx_iot_alarms_status (tenant_id, status),
    ADD INDEX idx_iot_alarms_triggered_at (tenant_id, triggered_at);

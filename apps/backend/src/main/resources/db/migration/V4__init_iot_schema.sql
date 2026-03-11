-- IoT schema hardening and query performance indexes.

CREATE INDEX idx_iot_devices_status ON iot_devices (tenant_id, status);
CREATE INDEX idx_iot_telemetry_recorded_at ON iot_telemetry_records (tenant_id, recorded_at);
CREATE INDEX idx_iot_alarms_status ON iot_alarms (tenant_id, status);
CREATE INDEX idx_iot_alarms_triggered_at ON iot_alarms (tenant_id, triggered_at);

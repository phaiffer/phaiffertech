ALTER TABLE iot_maintenance
    ADD COLUMN linked_alarm_id UUID NULL,
    ADD COLUMN linked_register_id UUID NULL,
    ADD COLUMN origin VARCHAR(40) NULL,
    ADD COLUMN trigger_message VARCHAR(255) NULL,
    ADD COLUMN assigned_user_label VARCHAR(120) NULL;

ALTER TABLE iot_maintenance
    ADD CONSTRAINT fk_iot_maintenance_linked_alarm
        FOREIGN KEY (linked_alarm_id) REFERENCES iot_alarms (id),
    ADD CONSTRAINT fk_iot_maintenance_linked_register
        FOREIGN KEY (linked_register_id) REFERENCES iot_registers (id);

CREATE INDEX idx_iot_maintenance_linked_alarm
    ON iot_maintenance (tenant_id, linked_alarm_id);

CREATE INDEX idx_iot_maintenance_linked_register
    ON iot_maintenance (tenant_id, linked_register_id);

CREATE INDEX idx_iot_maintenance_origin
    ON iot_maintenance (tenant_id, origin);

-- IoT V1 control plane expansion for devices and registers.

ALTER TABLE iot_devices
    ADD COLUMN description VARCHAR(255) NULL AFTER location;

CREATE INDEX idx_iot_devices_last_seen ON iot_devices (tenant_id, last_seen_at);

CREATE TABLE iot_registers (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    device_id CHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(80) NOT NULL,
    metric_name VARCHAR(80) NOT NULL,
    unit VARCHAR(40) NULL,
    data_type VARCHAR(40) NOT NULL,
    min_threshold DECIMAL(15,4) NULL,
    max_threshold DECIMAL(15,4) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_iot_registers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_iot_registers_device FOREIGN KEY (device_id) REFERENCES iot_devices (id),
    CONSTRAINT uq_iot_registers_device_code UNIQUE (tenant_id, device_id, code),
    INDEX idx_iot_registers_tenant_device (tenant_id, device_id),
    INDEX idx_iot_registers_metric_status (tenant_id, metric_name, status),
    INDEX idx_iot_registers_status (tenant_id, status)
);

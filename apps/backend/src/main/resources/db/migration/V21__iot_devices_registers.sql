-- IoT V1 control plane expansion for devices and registers.

ALTER TABLE iot_devices
    ADD COLUMN description VARCHAR(255) NULL;

CREATE INDEX idx_iot_devices_last_seen ON iot_devices (tenant_id, last_seen_at);

CREATE TABLE iot_registers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    device_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(80) NOT NULL,
    metric_name VARCHAR(80) NOT NULL,
    unit VARCHAR(40) NULL,
    data_type VARCHAR(40) NOT NULL,
    min_threshold DECIMAL(15,4) NULL,
    max_threshold DECIMAL(15,4) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_iot_registers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_iot_registers_device FOREIGN KEY (device_id) REFERENCES iot_devices (id),
    CONSTRAINT uq_iot_registers_device_code UNIQUE (tenant_id, device_id, code)
);

CREATE INDEX idx_iot_registers_tenant_device ON iot_registers (tenant_id, device_id);
CREATE INDEX idx_iot_registers_metric_status ON iot_registers (tenant_id, metric_name, status);
CREATE INDEX idx_iot_registers_status ON iot_registers (tenant_id, status);

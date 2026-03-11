CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_tenants_code ON tenants (code);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE roles (
    id UUID PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(300),
    system_role BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_roles_code ON roles (code);

CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(300),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_permissions_code ON permissions (code);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

CREATE TABLE user_tenants (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_user_tenant UNIQUE (tenant_id, user_id),
    CONSTRAINT fk_user_tenants_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_user_tenants_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_tenants_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

CREATE INDEX idx_user_tenants_tenant ON user_tenants (tenant_id);
CREATE INDEX idx_user_tenants_user ON user_tenants (user_id);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_refresh_tokens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_refresh_tokens_tenant ON refresh_tokens (tenant_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_name VARCHAR(120) NOT NULL,
    entity_id VARCHAR(36),
    payload TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs (tenant_id);

CREATE TABLE module_definitions (
    id UUID PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_module_definitions_code ON module_definitions (code);

CREATE TABLE tenant_modules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    module_definition_id UUID NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_tenant_module UNIQUE (tenant_id, module_definition_id),
    CONSTRAINT fk_tenant_modules_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_tenant_modules_module FOREIGN KEY (module_definition_id) REFERENCES module_definitions (id)
);

CREATE INDEX idx_tenant_modules_tenant ON tenant_modules (tenant_id);

CREATE TABLE crm_contacts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120),
    email VARCHAR(180),
    phone VARCHAR(40),
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_crm_contacts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE INDEX idx_crm_contacts_tenant ON crm_contacts (tenant_id);

CREATE TABLE crm_leads (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    contact_name VARCHAR(150) NOT NULL,
    email VARCHAR(180),
    source VARCHAR(80),
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_crm_leads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE INDEX idx_crm_leads_tenant ON crm_leads (tenant_id);

CREATE TABLE pet_clients (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(180),
    phone VARCHAR(40),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_clients_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE INDEX idx_pet_clients_tenant ON pet_clients (tenant_id);

CREATE TABLE pet_profiles (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    client_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    species VARCHAR(60) NOT NULL,
    breed VARCHAR(80),
    birth_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_profiles_client FOREIGN KEY (client_id) REFERENCES pet_clients (id)
);

CREATE INDEX idx_pet_profiles_tenant ON pet_profiles (tenant_id);

CREATE TABLE pet_appointments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    pet_id UUID NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(40) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_appointments_pet FOREIGN KEY (pet_id) REFERENCES pet_profiles (id)
);

CREATE INDEX idx_pet_appointments_tenant ON pet_appointments (tenant_id);

CREATE TABLE iot_devices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    status VARCHAR(40) NOT NULL,
    last_seen_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_iot_devices_tenant_serial UNIQUE (tenant_id, serial_number),
    CONSTRAINT fk_iot_devices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE INDEX idx_iot_devices_tenant ON iot_devices (tenant_id);

CREATE TABLE iot_telemetry_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    device_id UUID NOT NULL,
    metric VARCHAR(80) NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_iot_telemetry_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_iot_telemetry_device FOREIGN KEY (device_id) REFERENCES iot_devices (id)
);

CREATE INDEX idx_iot_telemetry_tenant ON iot_telemetry_records (tenant_id);
CREATE INDEX idx_iot_telemetry_device ON iot_telemetry_records (device_id);

CREATE TABLE iot_alarms (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    device_id UUID NOT NULL,
    severity VARCHAR(40) NOT NULL,
    message VARCHAR(255) NOT NULL,
    status VARCHAR(40) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_iot_alarms_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_iot_alarms_device FOREIGN KEY (device_id) REFERENCES iot_devices (id)
);

CREATE INDEX idx_iot_alarms_tenant ON iot_alarms (tenant_id);

CREATE TABLE pet_service_inventory_links (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    service_id UUID NOT NULL,
    inventory_item_id UUID NOT NULL,
    expected_quantity NUMERIC(10, 2) NOT NULL,
    consumption_rule VARCHAR(40) NOT NULL DEFAULT 'FIXED_PER_SERVICE',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_service_inventory_links_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_service_inventory_links_service FOREIGN KEY (service_id) REFERENCES pet_services (id),
    CONSTRAINT fk_pet_service_inventory_links_inventory_item FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id),
    CONSTRAINT uq_pet_service_inventory_links UNIQUE (service_id, inventory_item_id),
    CONSTRAINT chk_pet_service_inventory_links_expected_quantity_positive CHECK (expected_quantity > 0),
    CONSTRAINT chk_pet_service_inventory_links_rule CHECK (
        consumption_rule IN ('FIXED_PER_SERVICE')
    )
);

CREATE INDEX idx_pet_service_inventory_links_tenant_service
    ON pet_service_inventory_links (tenant_id, service_id, active);

CREATE INDEX idx_pet_service_inventory_links_tenant_inventory_item
    ON pet_service_inventory_links (tenant_id, inventory_item_id);

COMMENT ON TABLE pet_service_inventory_links IS
    'Structured inventory recipe attached to each PetFlow service definition.';

COMMENT ON COLUMN pet_service_inventory_links.expected_quantity IS
    'Planned quantity expected for one execution of the linked service.';

CREATE TABLE pet_appointment_service_inventory (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    appointment_service_id UUID NOT NULL,
    inventory_item_id UUID NOT NULL,
    inventory_item_name VARCHAR(150) NOT NULL,
    inventory_item_sku VARCHAR(80) NOT NULL,
    inventory_category VARCHAR(60) NOT NULL,
    unit_of_measure VARCHAR(40) NOT NULL DEFAULT 'UNIT',
    expected_quantity NUMERIC(10, 2) NOT NULL,
    consumption_rule VARCHAR(40) NOT NULL DEFAULT 'FIXED_PER_SERVICE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_appointment_service_inventory_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_appointment_service_inventory_service_line
        FOREIGN KEY (appointment_service_id) REFERENCES pet_appointment_services (id) ON DELETE CASCADE,
    CONSTRAINT fk_pet_appointment_service_inventory_item
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id),
    CONSTRAINT uq_pet_appointment_service_inventory UNIQUE (appointment_service_id, inventory_item_id),
    CONSTRAINT chk_pet_appointment_service_inventory_expected_quantity_positive CHECK (expected_quantity > 0),
    CONSTRAINT chk_pet_appointment_service_inventory_rule CHECK (
        consumption_rule IN ('FIXED_PER_SERVICE')
    )
);

CREATE INDEX idx_pet_appointment_service_inventory_tenant_line
    ON pet_appointment_service_inventory (tenant_id, appointment_service_id);

CREATE INDEX idx_pet_appointment_service_inventory_tenant_inventory_item
    ON pet_appointment_service_inventory (tenant_id, inventory_item_id);

COMMENT ON TABLE pet_appointment_service_inventory IS
    'Expected inventory consumption snapshot captured for each appointment service line.';

COMMENT ON COLUMN pet_appointment_service_inventory.expected_quantity IS
    'Read-only planned consumption snapshot. Actual stock deduction stays outside this first rollout.';

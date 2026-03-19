-- Shared inventory foundation for Pet retail/clinical supplies and IoT parts.

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(80) NOT NULL,
    category VARCHAR(60) NOT NULL,
    unit_of_measure VARCHAR(40) NOT NULL DEFAULT 'UNIT',
    current_quantity INT NOT NULL DEFAULT 0,
    minimum_quantity INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_inventory_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT uq_inventory_items_tenant_sku UNIQUE (tenant_id, sku),
    CONSTRAINT chk_inventory_items_current_quantity_non_negative CHECK (current_quantity >= 0),
    CONSTRAINT chk_inventory_items_minimum_quantity_non_negative CHECK (minimum_quantity >= 0),
    CONSTRAINT chk_inventory_items_reorder_point_non_negative CHECK (reorder_point >= 0)
);

CREATE INDEX idx_inventory_items_tenant_category ON inventory_items (tenant_id, category);
CREATE INDEX idx_inventory_items_tenant_quantity ON inventory_items (tenant_id, current_quantity, reorder_point);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    inventory_item_id UUID NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    source_type VARCHAR(60) NOT NULL,
    source_reference_id UUID NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_inventory_movements_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_inventory_movements_item FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id),
    CONSTRAINT chk_inventory_movements_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_inventory_movements_item_created ON inventory_movements (tenant_id, inventory_item_id, created_at DESC);
CREATE INDEX idx_inventory_movements_source ON inventory_movements (tenant_id, source_type, source_reference_id);

ALTER TABLE pet_products
    ADD COLUMN inventory_item_id UUID NULL;

WITH seeded_inventory AS (
    INSERT INTO inventory_items (
        id,
        tenant_id,
        name,
        sku,
        category,
        unit_of_measure,
        current_quantity,
        minimum_quantity,
        reorder_point,
        created_at,
        updated_at,
        created_by,
        updated_by,
        deleted_at
    )
    SELECT
        gen_random_uuid(),
        p.tenant_id,
        p.name,
        p.sku,
        'PET_RETAIL_GOOD',
        'UNIT',
        p.stock_quantity,
        0,
        5,
        p.created_at,
        p.updated_at,
        p.created_by,
        p.updated_by,
        p.deleted_at
    FROM pet_products p
    WHERE p.inventory_item_id IS NULL
    RETURNING id, tenant_id, sku
)
UPDATE pet_products p
SET inventory_item_id = seeded_inventory.id
FROM seeded_inventory
WHERE p.tenant_id = seeded_inventory.tenant_id
  AND p.sku = seeded_inventory.sku
  AND p.inventory_item_id IS NULL;

WITH product_balances AS (
    SELECT
        p.id AS product_id,
        p.tenant_id,
        p.inventory_item_id,
        p.stock_quantity
            - COALESCE(SUM(
                CASE
                    WHEN UPPER(m.movement_type) = 'OUT' AND m.deleted_at IS NULL THEN -m.quantity
                    WHEN m.deleted_at IS NULL THEN m.quantity
                    ELSE 0
                END
            ), 0) AS opening_balance
    FROM pet_products p
    LEFT JOIN pet_inventory_movements m ON m.product_id = p.id
    GROUP BY p.id, p.tenant_id, p.inventory_item_id, p.stock_quantity
),
normalized_movements AS (
    SELECT
        m.id,
        p.tenant_id,
        p.inventory_item_id,
        p.id AS product_id,
        CASE
            WHEN UPPER(m.movement_type) = 'OUT' THEN 'OUT'
            ELSE 'IN'
        END AS movement_type,
        m.quantity,
        CASE
            WHEN UPPER(m.movement_type) = 'OUT' THEN -m.quantity
            ELSE m.quantity
        END AS signed_quantity,
        pb.opening_balance,
        COALESCE(NULLIF(BTRIM(m.notes), ''), 'Pet inventory movement migrated from legacy ledger.') AS reason,
        m.created_at,
        m.updated_at,
        m.created_by,
        m.updated_by
    FROM pet_inventory_movements m
    JOIN pet_products p ON p.id = m.product_id
    JOIN product_balances pb ON pb.product_id = p.id
    WHERE m.deleted_at IS NULL
)
INSERT INTO inventory_movements (
    id,
    tenant_id,
    inventory_item_id,
    movement_type,
    quantity,
    quantity_before,
    quantity_after,
    source_type,
    source_reference_id,
    reason,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at
)
SELECT
    nm.id,
    nm.tenant_id,
    nm.inventory_item_id,
    nm.movement_type,
    nm.quantity,
    nm.opening_balance
        + COALESCE(
            SUM(nm.signed_quantity) OVER (
                PARTITION BY nm.product_id
                ORDER BY nm.created_at, nm.id
                ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
            ),
            0
        ) AS quantity_before,
    nm.opening_balance
        + SUM(nm.signed_quantity) OVER (
            PARTITION BY nm.product_id
            ORDER BY nm.created_at, nm.id
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS quantity_after,
    'MANUAL',
    nm.product_id,
    nm.reason,
    nm.created_at,
    nm.updated_at,
    nm.created_by,
    nm.updated_by,
    NULL
FROM normalized_movements nm;

ALTER TABLE pet_products
    ADD CONSTRAINT fk_pet_products_inventory_item
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id);

ALTER TABLE pet_products
    ALTER COLUMN inventory_item_id SET NOT NULL;

ALTER TABLE pet_products
    ADD CONSTRAINT uq_pet_products_inventory_item UNIQUE (inventory_item_id);

CREATE TABLE iot_parts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    inventory_item_id UUID NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_iot_parts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_iot_parts_inventory_item FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id),
    CONSTRAINT uq_iot_parts_inventory_item UNIQUE (inventory_item_id)
);

CREATE INDEX idx_iot_parts_tenant_inventory ON iot_parts (tenant_id, inventory_item_id);

INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001344'::uuid AS id, 'iot.part.read' AS code, 'Read IoT inventory parts' AS description
    UNION ALL SELECT '00000000-0000-0000-0000-000000001345'::uuid, 'iot.part.create', 'Create IoT inventory parts'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001346'::uuid, 'iot.part.update', 'Update IoT inventory parts'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001347'::uuid, 'iot.part.delete', 'Delete IoT inventory parts'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions p
    WHERE p.code = seed.code
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'iot.part.read'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'iot.part.create',
    'iot.part.update'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'iot.part.delete'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

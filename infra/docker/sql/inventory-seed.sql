-- Optional Inventory sample seed for local development.

INSERT INTO inventory_items (
    id, tenant_id, name, sku, category, unit_of_measure,
    current_quantity, minimum_quantity, reorder_point,
    created_by, updated_by
)
SELECT
    'e1111111-0000-0000-0000-000000000001',
    t.id,
    'Vaccine Distemper 10ml', 'VAC-DIST-10ML', 'PET_VETERINARY_SUPPLY', 'UNIT',
    2, 5, 10,
    'seed', 'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM inventory_items i
      WHERE i.tenant_id = t.id AND i.sku = 'VAC-DIST-10ML'
  );

INSERT INTO inventory_items (
    id, tenant_id, name, sku, category, unit_of_measure,
    current_quantity, minimum_quantity, reorder_point,
    created_by, updated_by
)
SELECT
    'e1111111-0000-0000-0000-000000000002',
    t.id,
    'Antiparasitic Collar L', 'COLLAR-AP-L', 'PET_RETAIL_GOOD', 'UNIT',
    24, 5, 12,
    'seed', 'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM inventory_items i
      WHERE i.tenant_id = t.id AND i.sku = 'COLLAR-AP-L'
  );

INSERT INTO inventory_items (
    id, tenant_id, name, sku, category, unit_of_measure,
    current_quantity, minimum_quantity, reorder_point,
    created_by, updated_by
)
SELECT
    'e1111111-0000-0000-0000-000000000003',
    t.id,
    'Hypoallergenic Shampoo 5L', 'SHAMPOO-HYPO-5L', 'PET_RETAIL_GOOD', 'UNIT',
    1, 3, 8,
    'seed', 'seed'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1 FROM inventory_items i
      WHERE i.tenant_id = t.id AND i.sku = 'SHAMPOO-HYPO-5L'
  );

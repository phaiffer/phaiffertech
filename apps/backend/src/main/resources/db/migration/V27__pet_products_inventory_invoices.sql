-- PET V1 commercial entities and permissions.

CREATE TABLE pet_products (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(80) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pet_products_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT uq_pet_products_tenant_sku UNIQUE (tenant_id, sku),
    INDEX idx_pet_products_name (tenant_id, name)
);

CREATE TABLE pet_inventory_movements (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pet_inventory_movements_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_inventory_movements_product FOREIGN KEY (product_id) REFERENCES pet_products (id),
    INDEX idx_pet_inventory_movements_product (tenant_id, product_id, created_at),
    INDEX idx_pet_inventory_movements_type (tenant_id, movement_type)
);

CREATE TABLE pet_invoices (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    client_id CHAR(36) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(40) NOT NULL DEFAULT 'ISSUED',
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_pet_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_invoices_client FOREIGN KEY (client_id) REFERENCES pet_clients (id),
    INDEX idx_pet_invoices_client (tenant_id, client_id, issued_at),
    INDEX idx_pet_invoices_status (tenant_id, status, issued_at)
);

INSERT INTO permissions (id, code, description)
SELECT seed.id, seed.code, seed.description
FROM (
    SELECT '00000000-0000-0000-0000-000000001311' AS id, 'pet.service.read' AS code, 'Read pet services' AS description
    UNION ALL SELECT '00000000-0000-0000-0000-000000001312', 'pet.service.create', 'Create pet services'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001313', 'pet.service.update', 'Update pet services'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001314', 'pet.service.delete', 'Delete pet services'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001315', 'pet.professional.read', 'Read pet professionals'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001316', 'pet.professional.create', 'Create pet professionals'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001317', 'pet.professional.update', 'Update pet professionals'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001318', 'pet.professional.delete', 'Delete pet professionals'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001319', 'pet.medical-record.read', 'Read pet medical records'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001320', 'pet.medical-record.create', 'Create pet medical records'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001321', 'pet.medical-record.update', 'Update pet medical records'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001322', 'pet.medical-record.delete', 'Delete pet medical records'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001323', 'pet.vaccination.read', 'Read pet vaccinations'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001324', 'pet.vaccination.create', 'Create pet vaccinations'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001325', 'pet.vaccination.update', 'Update pet vaccinations'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001326', 'pet.vaccination.delete', 'Delete pet vaccinations'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001327', 'pet.prescription.read', 'Read pet prescriptions'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001328', 'pet.prescription.create', 'Create pet prescriptions'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001329', 'pet.prescription.update', 'Update pet prescriptions'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001330', 'pet.prescription.delete', 'Delete pet prescriptions'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001331', 'pet.product.read', 'Read pet products'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001332', 'pet.product.create', 'Create pet products'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001333', 'pet.product.update', 'Update pet products'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001334', 'pet.product.delete', 'Delete pet products'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001335', 'pet.inventory.read', 'Read pet inventory movements'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001336', 'pet.inventory.create', 'Create pet inventory movements'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001337', 'pet.inventory.update', 'Update pet inventory movements'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001338', 'pet.inventory.delete', 'Delete pet inventory movements'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001339', 'pet.invoice.read', 'Read pet invoices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001340', 'pet.invoice.create', 'Create pet invoices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001341', 'pet.invoice.update', 'Update pet invoices'
    UNION ALL SELECT '00000000-0000-0000-0000-000000001342', 'pet.invoice.delete', 'Delete pet invoices'
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
    'pet.service.read',
    'pet.professional.read',
    'pet.medical-record.read',
    'pet.vaccination.read',
    'pet.prescription.read',
    'pet.product.read',
    'pet.inventory.read',
    'pet.invoice.read'
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
    'pet.service.create',
    'pet.professional.create',
    'pet.medical-record.create',
    'pet.vaccination.create',
    'pet.prescription.create',
    'pet.product.create',
    'pet.inventory.create',
    'pet.invoice.create'
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
    'pet.service.update',
    'pet.professional.update',
    'pet.medical-record.update',
    'pet.vaccination.update',
    'pet.prescription.update',
    'pet.product.update',
    'pet.inventory.update',
    'pet.invoice.update'
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
    'pet.service.delete',
    'pet.professional.delete',
    'pet.medical-record.delete',
    'pet.vaccination.delete',
    'pet.prescription.delete',
    'pet.product.delete',
    'pet.inventory.delete',
    'pet.invoice.delete'
)
WHERE r.code IN ('PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN')
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

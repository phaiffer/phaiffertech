CREATE TABLE IF NOT EXISTS pet_billing_message_settings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
    pix_key VARCHAR(180) NULL,
    billing_display_name VARCHAR(150) NULL,
    plan_renewal_message_template TEXT NULL,
    pet_ready_message_template TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system'
);

COMMENT ON TABLE pet_billing_message_settings IS
    'Tenant-scoped PetFlow billing and customer message defaults used for safe manual-send workflows.';

COMMENT ON COLUMN pet_billing_message_settings.pix_key IS
    'Tenant PIX key shown in generated renewal reminder messages. No payment gateway integration is implied.';

COMMENT ON COLUMN pet_billing_message_settings.plan_renewal_message_template IS
    'Optional controlled template for last-bath renewal reminders. Placeholders are resolved by the backend.';

COMMENT ON COLUMN pet_billing_message_settings.pet_ready_message_template IS
    'Optional controlled template for pet-ready pickup messages. Placeholders are resolved by the backend.';

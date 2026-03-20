-- Brazilian fiscal readiness foundation without external provider integration.

CREATE TABLE tenant_fiscal_profiles (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX',
    provider_code VARCHAR(40) NULL,
    provider_settings_reference VARCHAR(120) NULL,
    issuer_legal_name VARCHAR(160) NULL,
    issuer_trade_name VARCHAR(160) NULL,
    issuer_document_type VARCHAR(20) NULL,
    issuer_document_number VARCHAR(32) NULL,
    issuer_state_registration VARCHAR(40) NULL,
    issuer_municipal_registration VARCHAR(40) NULL,
    issuer_tax_regime_code VARCHAR(40) NULL,
    issuer_city_code VARCHAR(16) NULL,
    issuer_country_code VARCHAR(2) NOT NULL DEFAULT 'BR',
    last_validated_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_tenant_fiscal_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT chk_tenant_fiscal_profiles_environment CHECK (environment IN ('SANDBOX', 'PRODUCTION')),
    CONSTRAINT chk_tenant_fiscal_profiles_country_code CHECK (char_length(issuer_country_code) = 2)
);

CREATE UNIQUE INDEX uq_tenant_fiscal_profiles_tenant
    ON tenant_fiscal_profiles (tenant_id);

ALTER TABLE finance_invoices
    ADD COLUMN fiscal_provider_code VARCHAR(40) NULL,
    ADD COLUMN issuer_legal_name VARCHAR(160) NULL,
    ADD COLUMN issuer_document_type VARCHAR(20) NULL,
    ADD COLUMN issuer_document_number VARCHAR(32) NULL,
    ADD COLUMN issuer_state_registration VARCHAR(40) NULL,
    ADD COLUMN issuer_municipal_registration VARCHAR(40) NULL,
    ADD COLUMN issuer_tax_regime_code VARCHAR(40) NULL,
    ADD COLUMN recipient_legal_name VARCHAR(160) NULL,
    ADD COLUMN recipient_document_type VARCHAR(20) NULL,
    ADD COLUMN recipient_document_number VARCHAR(32) NULL,
    ADD COLUMN recipient_state_registration VARCHAR(40) NULL,
    ADD COLUMN recipient_municipal_registration VARCHAR(40) NULL,
    ADD COLUMN recipient_email VARCHAR(160) NULL;

UPDATE finance_invoices
SET recipient_legal_name = counterparty_name
WHERE recipient_legal_name IS NULL
  AND counterparty_name IS NOT NULL;

CREATE INDEX idx_finance_invoices_fiscal_tracking
    ON finance_invoices (tenant_id, fiscal_status, fiscal_provider_code, issued_at DESC);

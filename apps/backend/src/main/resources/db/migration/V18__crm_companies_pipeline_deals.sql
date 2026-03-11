-- CRM V1: companies, explicit relations and pipeline stage hardening.

CREATE TABLE crm_companies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    legal_name VARCHAR(190) NULL,
    document VARCHAR(40) NULL,
    email VARCHAR(180) NULL,
    phone VARCHAR(40) NULL,
    website VARCHAR(255) NULL,
    industry VARCHAR(120) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    owner_user_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_crm_companies_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_crm_companies_owner_user FOREIGN KEY (owner_user_id) REFERENCES users (id)
);

CREATE INDEX idx_crm_companies_tenant ON crm_companies (tenant_id);
CREATE INDEX idx_crm_companies_owner ON crm_companies (tenant_id, owner_user_id);
CREATE INDEX idx_crm_companies_status ON crm_companies (tenant_id, status);
CREATE INDEX idx_crm_companies_document ON crm_companies (tenant_id, document);
CREATE INDEX idx_crm_companies_deleted_at ON crm_companies (tenant_id, deleted_at);

ALTER TABLE crm_contacts
    ADD COLUMN company_id UUID NULL;

ALTER TABLE crm_contacts
    ADD CONSTRAINT fk_crm_contacts_company FOREIGN KEY (company_id) REFERENCES crm_companies (id);

CREATE INDEX idx_crm_contacts_company_id ON crm_contacts (tenant_id, company_id);

ALTER TABLE crm_leads
    ADD COLUMN company_id UUID NULL,
    ADD COLUMN contact_id UUID NULL,
    ADD COLUMN notes TEXT NULL;

ALTER TABLE crm_leads
    ADD CONSTRAINT fk_crm_leads_company FOREIGN KEY (company_id) REFERENCES crm_companies (id),
    ADD CONSTRAINT fk_crm_leads_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts (id);

CREATE INDEX idx_crm_leads_company_id ON crm_leads (tenant_id, company_id);
CREATE INDEX idx_crm_leads_contact_id ON crm_leads (tenant_id, contact_id);

ALTER TABLE crm_pipeline_stages
    ADD COLUMN position INT NULL,
    ADD COLUMN code VARCHAR(60) NULL,
    ADD COLUMN color VARCHAR(24) NULL,
    ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_crm_pipeline_stages_position ON crm_pipeline_stages (tenant_id, pipeline_id, position);
CREATE INDEX idx_crm_pipeline_stages_default ON crm_pipeline_stages (tenant_id, is_default);

UPDATE crm_pipeline_stages
SET position = sort_order
WHERE position IS NULL;

ALTER TABLE crm_pipeline_stages
    ALTER COLUMN sort_order DROP NOT NULL,
    ALTER COLUMN position SET NOT NULL;

UPDATE crm_pipeline_stages
SET code = UPPER(name)
WHERE code IS NULL;

UPDATE crm_pipeline_stages
SET color = CASE position
    WHEN 1 THEN '#2563eb'
    WHEN 2 THEN '#7c3aed'
    WHEN 3 THEN '#16a34a'
    WHEN 4 THEN '#ea580c'
    ELSE '#475569'
END
WHERE color IS NULL;

UPDATE crm_pipeline_stages
SET is_default = CASE WHEN position = 1 THEN TRUE ELSE FALSE END;

ALTER TABLE crm_deals
    ADD COLUMN pipeline_stage_id UUID NULL,
    ADD COLUMN company_id UUID NULL,
    ADD COLUMN currency VARCHAR(8) NOT NULL DEFAULT 'BRL';

ALTER TABLE crm_deals
    ADD CONSTRAINT fk_crm_deals_pipeline_stage_v2 FOREIGN KEY (pipeline_stage_id) REFERENCES crm_pipeline_stages (id),
    ADD CONSTRAINT fk_crm_deals_company FOREIGN KEY (company_id) REFERENCES crm_companies (id);

CREATE INDEX idx_crm_deals_company ON crm_deals (tenant_id, company_id);
CREATE INDEX idx_crm_deals_stage_v2 ON crm_deals (tenant_id, pipeline_stage_id);
CREATE INDEX idx_crm_deals_deleted_at ON crm_deals (tenant_id, deleted_at);

UPDATE crm_deals
SET pipeline_stage_id = stage_id
WHERE pipeline_stage_id IS NULL
  AND stage_id IS NOT NULL;

-- CRM V1: companies, explicit relations and pipeline stage hardening.

CREATE TABLE crm_companies (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(160) NOT NULL,
    legal_name VARCHAR(190) NULL,
    document VARCHAR(40) NULL,
    email VARCHAR(180) NULL,
    phone VARCHAR(40) NULL,
    website VARCHAR(255) NULL,
    industry VARCHAR(120) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    owner_user_id CHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_crm_companies_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_crm_companies_owner_user FOREIGN KEY (owner_user_id) REFERENCES users (id),
    INDEX idx_crm_companies_tenant (tenant_id),
    INDEX idx_crm_companies_owner (tenant_id, owner_user_id),
    INDEX idx_crm_companies_status (tenant_id, status),
    INDEX idx_crm_companies_document (tenant_id, document),
    INDEX idx_crm_companies_deleted_at (tenant_id, deleted_at)
);

ALTER TABLE crm_contacts
    ADD COLUMN company_id CHAR(36) NULL AFTER company,
    ADD CONSTRAINT fk_crm_contacts_company FOREIGN KEY (company_id) REFERENCES crm_companies (id),
    ADD INDEX idx_crm_contacts_company_id (tenant_id, company_id);

ALTER TABLE crm_leads
    ADD COLUMN company_id CHAR(36) NULL AFTER assigned_user_id,
    ADD COLUMN contact_id CHAR(36) NULL AFTER company_id,
    ADD COLUMN notes TEXT NULL AFTER contact_id,
    ADD CONSTRAINT fk_crm_leads_company FOREIGN KEY (company_id) REFERENCES crm_companies (id),
    ADD CONSTRAINT fk_crm_leads_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts (id),
    ADD INDEX idx_crm_leads_company_id (tenant_id, company_id),
    ADD INDEX idx_crm_leads_contact_id (tenant_id, contact_id);

ALTER TABLE crm_pipeline_stages
    ADD COLUMN position INT NULL AFTER sort_order,
    ADD COLUMN code VARCHAR(60) NULL AFTER name,
    ADD COLUMN color VARCHAR(24) NULL AFTER position,
    ADD COLUMN is_default BIT(1) NOT NULL DEFAULT b'0' AFTER color,
    ADD INDEX idx_crm_pipeline_stages_position (tenant_id, pipeline_id, position),
    ADD INDEX idx_crm_pipeline_stages_default (tenant_id, is_default);

UPDATE crm_pipeline_stages
SET position = sort_order
WHERE position IS NULL;

ALTER TABLE crm_pipeline_stages
    MODIFY COLUMN sort_order INT NULL,
    MODIFY COLUMN position INT NOT NULL;

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
SET is_default = CASE WHEN position = 1 THEN b'1' ELSE b'0' END;

ALTER TABLE crm_deals
    ADD COLUMN pipeline_stage_id CHAR(36) NULL AFTER pipeline_id,
    ADD COLUMN company_id CHAR(36) NULL AFTER expected_close_date,
    ADD COLUMN currency VARCHAR(8) NOT NULL DEFAULT 'BRL' AFTER amount,
    ADD CONSTRAINT fk_crm_deals_pipeline_stage_v2 FOREIGN KEY (pipeline_stage_id) REFERENCES crm_pipeline_stages (id),
    ADD CONSTRAINT fk_crm_deals_company FOREIGN KEY (company_id) REFERENCES crm_companies (id),
    ADD INDEX idx_crm_deals_company (tenant_id, company_id),
    ADD INDEX idx_crm_deals_stage_v2 (tenant_id, pipeline_stage_id),
    ADD INDEX idx_crm_deals_deleted_at (tenant_id, deleted_at);

UPDATE crm_deals
SET pipeline_stage_id = stage_id
WHERE pipeline_stage_id IS NULL
  AND stage_id IS NOT NULL;

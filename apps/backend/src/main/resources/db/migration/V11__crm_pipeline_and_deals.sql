-- CRM pipeline and deals base schema.

CREATE TABLE crm_pipelines (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    is_default BIT(1) NOT NULL DEFAULT b'0',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_crm_pipelines_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT uq_crm_pipelines_tenant_name UNIQUE (tenant_id, name),
    INDEX idx_crm_pipelines_tenant (tenant_id),
    INDEX idx_crm_pipelines_default (tenant_id, is_default)
);

CREATE TABLE crm_pipeline_stages (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    pipeline_id CHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_crm_pipeline_stages_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_crm_pipeline_stages_pipeline FOREIGN KEY (pipeline_id) REFERENCES crm_pipelines (id),
    CONSTRAINT uq_crm_pipeline_stages_order UNIQUE (pipeline_id, sort_order),
    CONSTRAINT uq_crm_pipeline_stages_name UNIQUE (pipeline_id, name),
    INDEX idx_crm_pipeline_stages_tenant (tenant_id),
    INDEX idx_crm_pipeline_stages_pipeline (pipeline_id)
);

CREATE TABLE crm_deals (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NULL,
    amount DECIMAL(15,2) NULL,
    status VARCHAR(40) NOT NULL,
    pipeline_id CHAR(36) NOT NULL,
    stage_id CHAR(36) NULL,
    contact_id CHAR(36) NULL,
    lead_id CHAR(36) NULL,
    owner_user_id CHAR(36) NULL,
    expected_close_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_crm_deals_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_crm_deals_pipeline FOREIGN KEY (pipeline_id) REFERENCES crm_pipelines (id),
    CONSTRAINT fk_crm_deals_stage FOREIGN KEY (stage_id) REFERENCES crm_pipeline_stages (id),
    CONSTRAINT fk_crm_deals_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts (id),
    CONSTRAINT fk_crm_deals_lead FOREIGN KEY (lead_id) REFERENCES crm_leads (id),
    CONSTRAINT fk_crm_deals_owner_user FOREIGN KEY (owner_user_id) REFERENCES users (id),
    INDEX idx_crm_deals_tenant_status (tenant_id, status),
    INDEX idx_crm_deals_pipeline_stage (tenant_id, pipeline_id, stage_id),
    INDEX idx_crm_deals_owner (tenant_id, owner_user_id),
    INDEX idx_crm_deals_contact (tenant_id, contact_id),
    INDEX idx_crm_deals_lead (tenant_id, lead_id)
);

INSERT INTO crm_pipelines (id, tenant_id, name, is_default)
SELECT '55555555-5555-5555-5555-555555555001', t.id, 'Default Pipeline', b'1'
FROM tenants t
WHERE t.code = 'default'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_pipelines p
      WHERE p.tenant_id = t.id
        AND p.is_default = b'1'
  );

INSERT INTO crm_pipeline_stages (id, tenant_id, pipeline_id, name, sort_order)
SELECT '55555555-5555-5555-5555-555555555011', p.tenant_id, p.id, 'NEW', 1
FROM crm_pipelines p
WHERE p.id = '55555555-5555-5555-5555-555555555001'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_pipeline_stages s
      WHERE s.pipeline_id = p.id
        AND s.sort_order = 1
  );

INSERT INTO crm_pipeline_stages (id, tenant_id, pipeline_id, name, sort_order)
SELECT '55555555-5555-5555-5555-555555555012', p.tenant_id, p.id, 'QUALIFIED', 2
FROM crm_pipelines p
WHERE p.id = '55555555-5555-5555-5555-555555555001'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_pipeline_stages s
      WHERE s.pipeline_id = p.id
        AND s.sort_order = 2
  );

INSERT INTO crm_pipeline_stages (id, tenant_id, pipeline_id, name, sort_order)
SELECT '55555555-5555-5555-5555-555555555013', p.tenant_id, p.id, 'WON', 3
FROM crm_pipelines p
WHERE p.id = '55555555-5555-5555-5555-555555555001'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_pipeline_stages s
      WHERE s.pipeline_id = p.id
        AND s.sort_order = 3
  );

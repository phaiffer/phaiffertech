-- CRM V1: explicit note/task relations and audit indexes for activity/dashboard reads.

ALTER TABLE crm_notes
    ADD COLUMN company_id UUID NULL,
    ADD COLUMN contact_id UUID NULL,
    ADD COLUMN lead_id UUID NULL,
    ADD COLUMN deal_id UUID NULL;

ALTER TABLE crm_notes
    ADD CONSTRAINT fk_crm_notes_company FOREIGN KEY (company_id) REFERENCES crm_companies (id),
    ADD CONSTRAINT fk_crm_notes_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts (id),
    ADD CONSTRAINT fk_crm_notes_lead FOREIGN KEY (lead_id) REFERENCES crm_leads (id),
    ADD CONSTRAINT fk_crm_notes_deal FOREIGN KEY (deal_id) REFERENCES crm_deals (id);

CREATE INDEX idx_crm_notes_company ON crm_notes (tenant_id, company_id);
CREATE INDEX idx_crm_notes_contact ON crm_notes (tenant_id, contact_id);
CREATE INDEX idx_crm_notes_lead ON crm_notes (tenant_id, lead_id);
CREATE INDEX idx_crm_notes_deal ON crm_notes (tenant_id, deal_id);
CREATE INDEX idx_crm_notes_deleted_at ON crm_notes (tenant_id, deleted_at);

UPDATE crm_notes
SET company_id = CASE WHEN UPPER(related_type) = 'COMPANY' THEN related_id ELSE NULL END,
    contact_id = CASE WHEN UPPER(related_type) = 'CONTACT' THEN related_id ELSE NULL END,
    lead_id = CASE WHEN UPPER(related_type) = 'LEAD' THEN related_id ELSE NULL END,
    deal_id = CASE WHEN UPPER(related_type) = 'DEAL' THEN related_id ELSE NULL END
WHERE related_type IS NOT NULL
  AND related_id IS NOT NULL;

ALTER TABLE crm_tasks
    ADD COLUMN priority VARCHAR(40) NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN company_id UUID NULL,
    ADD COLUMN contact_id UUID NULL,
    ADD COLUMN lead_id UUID NULL,
    ADD COLUMN deal_id UUID NULL;

ALTER TABLE crm_tasks
    ADD CONSTRAINT fk_crm_tasks_company FOREIGN KEY (company_id) REFERENCES crm_companies (id),
    ADD CONSTRAINT fk_crm_tasks_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts (id),
    ADD CONSTRAINT fk_crm_tasks_lead FOREIGN KEY (lead_id) REFERENCES crm_leads (id),
    ADD CONSTRAINT fk_crm_tasks_deal FOREIGN KEY (deal_id) REFERENCES crm_deals (id);

CREATE INDEX idx_crm_tasks_priority ON crm_tasks (tenant_id, priority);
CREATE INDEX idx_crm_tasks_company ON crm_tasks (tenant_id, company_id);
CREATE INDEX idx_crm_tasks_contact ON crm_tasks (tenant_id, contact_id);
CREATE INDEX idx_crm_tasks_lead ON crm_tasks (tenant_id, lead_id);
CREATE INDEX idx_crm_tasks_deal ON crm_tasks (tenant_id, deal_id);
CREATE INDEX idx_crm_tasks_deleted_at ON crm_tasks (tenant_id, deleted_at);

UPDATE crm_tasks
SET company_id = CASE WHEN UPPER(related_type) = 'COMPANY' THEN related_id ELSE NULL END,
    contact_id = CASE WHEN UPPER(related_type) = 'CONTACT' THEN related_id ELSE NULL END,
    lead_id = CASE WHEN UPPER(related_type) = 'LEAD' THEN related_id ELSE NULL END,
    deal_id = CASE WHEN UPPER(related_type) = 'DEAL' THEN related_id ELSE NULL END
WHERE related_type IS NOT NULL
  AND related_id IS NOT NULL;

CREATE INDEX idx_audit_logs_tenant_entity_action_created
    ON audit_logs (tenant_id, entity_name, action, created_at);

CREATE INDEX idx_audit_logs_tenant_created
    ON audit_logs (tenant_id, created_at);

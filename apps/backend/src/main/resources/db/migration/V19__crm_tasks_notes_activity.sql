-- CRM V1: explicit note/task relations and audit indexes for activity/dashboard reads.

ALTER TABLE crm_notes
    ADD COLUMN company_id CHAR(36) NULL AFTER content,
    ADD COLUMN contact_id CHAR(36) NULL AFTER company_id,
    ADD COLUMN lead_id CHAR(36) NULL AFTER contact_id,
    ADD COLUMN deal_id CHAR(36) NULL AFTER lead_id,
    ADD CONSTRAINT fk_crm_notes_company FOREIGN KEY (company_id) REFERENCES crm_companies (id),
    ADD CONSTRAINT fk_crm_notes_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts (id),
    ADD CONSTRAINT fk_crm_notes_lead FOREIGN KEY (lead_id) REFERENCES crm_leads (id),
    ADD CONSTRAINT fk_crm_notes_deal FOREIGN KEY (deal_id) REFERENCES crm_deals (id),
    ADD INDEX idx_crm_notes_company (tenant_id, company_id),
    ADD INDEX idx_crm_notes_contact (tenant_id, contact_id),
    ADD INDEX idx_crm_notes_lead (tenant_id, lead_id),
    ADD INDEX idx_crm_notes_deal (tenant_id, deal_id),
    ADD INDEX idx_crm_notes_deleted_at (tenant_id, deleted_at);

UPDATE crm_notes
SET company_id = CASE WHEN UPPER(related_type) = 'COMPANY' THEN related_id ELSE NULL END,
    contact_id = CASE WHEN UPPER(related_type) = 'CONTACT' THEN related_id ELSE NULL END,
    lead_id = CASE WHEN UPPER(related_type) = 'LEAD' THEN related_id ELSE NULL END,
    deal_id = CASE WHEN UPPER(related_type) = 'DEAL' THEN related_id ELSE NULL END
WHERE related_type IS NOT NULL
  AND related_id IS NOT NULL;

ALTER TABLE crm_tasks
    ADD COLUMN priority VARCHAR(40) NOT NULL DEFAULT 'MEDIUM' AFTER status,
    ADD COLUMN company_id CHAR(36) NULL AFTER assigned_user_id,
    ADD COLUMN contact_id CHAR(36) NULL AFTER company_id,
    ADD COLUMN lead_id CHAR(36) NULL AFTER contact_id,
    ADD COLUMN deal_id CHAR(36) NULL AFTER lead_id,
    ADD CONSTRAINT fk_crm_tasks_company FOREIGN KEY (company_id) REFERENCES crm_companies (id),
    ADD CONSTRAINT fk_crm_tasks_contact FOREIGN KEY (contact_id) REFERENCES crm_contacts (id),
    ADD CONSTRAINT fk_crm_tasks_lead FOREIGN KEY (lead_id) REFERENCES crm_leads (id),
    ADD CONSTRAINT fk_crm_tasks_deal FOREIGN KEY (deal_id) REFERENCES crm_deals (id),
    ADD INDEX idx_crm_tasks_priority (tenant_id, priority),
    ADD INDEX idx_crm_tasks_company (tenant_id, company_id),
    ADD INDEX idx_crm_tasks_contact (tenant_id, contact_id),
    ADD INDEX idx_crm_tasks_lead (tenant_id, lead_id),
    ADD INDEX idx_crm_tasks_deal (tenant_id, deal_id),
    ADD INDEX idx_crm_tasks_deleted_at (tenant_id, deleted_at);

UPDATE crm_tasks
SET company_id = CASE WHEN UPPER(related_type) = 'COMPANY' THEN related_id ELSE NULL END,
    contact_id = CASE WHEN UPPER(related_type) = 'CONTACT' THEN related_id ELSE NULL END,
    lead_id = CASE WHEN UPPER(related_type) = 'LEAD' THEN related_id ELSE NULL END,
    deal_id = CASE WHEN UPPER(related_type) = 'DEAL' THEN related_id ELSE NULL END
WHERE related_type IS NOT NULL
  AND related_id IS NOT NULL;

ALTER TABLE audit_logs
    ADD INDEX idx_audit_logs_tenant_entity_action_created (tenant_id, entity_name, action, created_at),
    ADD INDEX idx_audit_logs_tenant_created (tenant_id, created_at);


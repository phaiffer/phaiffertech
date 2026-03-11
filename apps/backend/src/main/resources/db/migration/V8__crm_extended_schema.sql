-- Extend CRM contacts and leads for v1 workflows.

ALTER TABLE crm_contacts
    ADD COLUMN company VARCHAR(160) NULL,
    ADD COLUMN owner_user_id UUID NULL;

ALTER TABLE crm_contacts
    ADD CONSTRAINT fk_crm_contacts_owner_user FOREIGN KEY (owner_user_id) REFERENCES users (id);

CREATE INDEX idx_crm_contacts_owner_user ON crm_contacts (tenant_id, owner_user_id);
CREATE INDEX idx_crm_contacts_name ON crm_contacts (tenant_id, first_name, last_name);
CREATE INDEX idx_crm_contacts_deleted_at ON crm_contacts (tenant_id, deleted_at);

ALTER TABLE crm_leads
    RENAME COLUMN contact_name TO name;

ALTER TABLE crm_leads
    ADD COLUMN phone VARCHAR(40) NULL,
    ADD COLUMN assigned_user_id UUID NULL;

ALTER TABLE crm_leads
    ADD CONSTRAINT fk_crm_leads_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users (id);

CREATE INDEX idx_crm_leads_assigned_user ON crm_leads (tenant_id, assigned_user_id);
CREATE INDEX idx_crm_leads_name ON crm_leads (tenant_id, name);
CREATE INDEX idx_crm_leads_deleted_at ON crm_leads (tenant_id, deleted_at);

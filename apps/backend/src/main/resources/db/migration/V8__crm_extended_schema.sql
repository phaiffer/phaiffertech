-- Extend CRM contacts and leads for v1 workflows.

ALTER TABLE crm_contacts
    ADD COLUMN company VARCHAR(160) NULL AFTER phone,
    ADD COLUMN owner_user_id CHAR(36) NULL AFTER status,
    ADD CONSTRAINT fk_crm_contacts_owner_user FOREIGN KEY (owner_user_id) REFERENCES users (id),
    ADD INDEX idx_crm_contacts_owner_user (tenant_id, owner_user_id),
    ADD INDEX idx_crm_contacts_name (tenant_id, first_name, last_name),
    ADD INDEX idx_crm_contacts_deleted_at (tenant_id, deleted_at);

ALTER TABLE crm_leads
    CHANGE COLUMN contact_name name VARCHAR(150) NOT NULL,
    ADD COLUMN phone VARCHAR(40) NULL AFTER email,
    ADD COLUMN assigned_user_id CHAR(36) NULL AFTER status,
    ADD CONSTRAINT fk_crm_leads_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users (id),
    ADD INDEX idx_crm_leads_assigned_user (tenant_id, assigned_user_id),
    ADD INDEX idx_crm_leads_name (tenant_id, name),
    ADD INDEX idx_crm_leads_deleted_at (tenant_id, deleted_at);

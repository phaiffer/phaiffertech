-- CRM schema hardening and query performance indexes.
ALTER TABLE crm_contacts
    ADD INDEX idx_crm_contacts_email (tenant_id, email),
    ADD INDEX idx_crm_contacts_status (tenant_id, status);

ALTER TABLE crm_leads
    ADD INDEX idx_crm_leads_email (tenant_id, email),
    ADD INDEX idx_crm_leads_source (tenant_id, source),
    ADD INDEX idx_crm_leads_status (tenant_id, status);

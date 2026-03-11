-- CRM schema hardening and query performance indexes.

CREATE INDEX idx_crm_contacts_email ON crm_contacts (tenant_id, email);
CREATE INDEX idx_crm_contacts_status ON crm_contacts (tenant_id, status);

CREATE INDEX idx_crm_leads_email ON crm_leads (tenant_id, email);
CREATE INDEX idx_crm_leads_source ON crm_leads (tenant_id, source);
CREATE INDEX idx_crm_leads_status ON crm_leads (tenant_id, status);

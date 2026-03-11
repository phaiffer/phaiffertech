-- Improve CRM list filtering performance for contacts and leads.

CREATE INDEX idx_crm_contacts_owner_status ON crm_contacts (tenant_id, owner_user_id, status);
CREATE INDEX idx_crm_leads_assigned_status ON crm_leads (tenant_id, assigned_user_id, status);

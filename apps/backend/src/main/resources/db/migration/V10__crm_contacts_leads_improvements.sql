-- Improve CRM list filtering performance for contacts and leads.

ALTER TABLE crm_contacts
    ADD INDEX idx_crm_contacts_owner_status (tenant_id, owner_user_id, status);

ALTER TABLE crm_leads
    ADD INDEX idx_crm_leads_assigned_status (tenant_id, assigned_user_id, status);

UPDATE crm_tasks
SET related_type = 'CRM.COMPANY'
WHERE UPPER(related_type) = 'COMPANY';

UPDATE crm_tasks
SET related_type = 'CRM.CONTACT'
WHERE UPPER(related_type) = 'CONTACT';

UPDATE crm_tasks
SET related_type = 'CRM.LEAD'
WHERE UPPER(related_type) = 'LEAD';

UPDATE crm_tasks
SET related_type = 'CRM.DEAL'
WHERE UPPER(related_type) = 'DEAL';

UPDATE crm_notes
SET related_type = 'CRM.COMPANY'
WHERE UPPER(related_type) = 'COMPANY';

UPDATE crm_notes
SET related_type = 'CRM.CONTACT'
WHERE UPPER(related_type) = 'CONTACT';

UPDATE crm_notes
SET related_type = 'CRM.LEAD'
WHERE UPPER(related_type) = 'LEAD';

UPDATE crm_notes
SET related_type = 'CRM.DEAL'
WHERE UPPER(related_type) = 'DEAL';

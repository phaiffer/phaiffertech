ALTER TABLE pet_clients
    ADD COLUMN document_type VARCHAR(20) NULL;

UPDATE pet_clients
SET document_type = CASE
    WHEN document IS NULL OR BTRIM(document) = '' THEN NULL
    WHEN REGEXP_REPLACE(document, '[^0-9]', '', 'g') ~ '^[0-9]{11}$' THEN 'CPF'
    ELSE 'RG'
END
WHERE document_type IS NULL;

CREATE INDEX idx_pet_clients_document_type ON pet_clients (tenant_id, document_type);

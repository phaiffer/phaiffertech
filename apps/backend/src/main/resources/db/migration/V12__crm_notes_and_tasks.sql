-- CRM notes and tasks base schema.

CREATE TABLE crm_notes (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    content TEXT NOT NULL,
    related_type VARCHAR(60) NOT NULL,
    related_id UUID NOT NULL,
    author_user_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_crm_notes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_crm_notes_author FOREIGN KEY (author_user_id) REFERENCES users (id)
);

CREATE INDEX idx_crm_notes_tenant_related ON crm_notes (tenant_id, related_type, related_id);
CREATE INDEX idx_crm_notes_author ON crm_notes (tenant_id, author_user_id);

CREATE TABLE crm_tasks (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NULL,
    due_date TIMESTAMPTZ NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'OPEN',
    assigned_user_id UUID NULL,
    related_type VARCHAR(60) NOT NULL,
    related_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_crm_tasks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_crm_tasks_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users (id)
);

CREATE INDEX idx_crm_tasks_tenant_status ON crm_tasks (tenant_id, status);
CREATE INDEX idx_crm_tasks_tenant_due_date ON crm_tasks (tenant_id, due_date);
CREATE INDEX idx_crm_tasks_related ON crm_tasks (tenant_id, related_type, related_id);
CREATE INDEX idx_crm_tasks_assigned_user ON crm_tasks (tenant_id, assigned_user_id);

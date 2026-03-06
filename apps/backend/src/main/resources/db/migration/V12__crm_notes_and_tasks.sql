-- CRM notes and tasks base schema.

CREATE TABLE crm_notes (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    related_type VARCHAR(60) NOT NULL,
    related_id CHAR(36) NOT NULL,
    author_user_id CHAR(36) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_crm_notes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_crm_notes_author FOREIGN KEY (author_user_id) REFERENCES users (id),
    INDEX idx_crm_notes_tenant_related (tenant_id, related_type, related_id),
    INDEX idx_crm_notes_author (tenant_id, author_user_id)
);

CREATE TABLE crm_tasks (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NULL,
    due_date TIMESTAMP NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'OPEN',
    assigned_user_id CHAR(36) NULL,
    related_type VARCHAR(60) NOT NULL,
    related_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_crm_tasks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_crm_tasks_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users (id),
    INDEX idx_crm_tasks_tenant_status (tenant_id, status),
    INDEX idx_crm_tasks_tenant_due_date (tenant_id, due_date),
    INDEX idx_crm_tasks_related (tenant_id, related_type, related_id),
    INDEX idx_crm_tasks_assigned_user (tenant_id, assigned_user_id)
);

-- PetFlow Sprint 2: separate commercial plan catalog from sold client plans.

CREATE TABLE pet_plan_templates (
    id             UUID          PRIMARY KEY,
    tenant_id      UUID          NOT NULL,
    commercial_name VARCHAR(150) NOT NULL,
    description    TEXT          NULL,
    price          DECIMAL(10,2) NOT NULL DEFAULT 0,
    validity_days  INT           NOT NULL,
    total_sessions INT           NOT NULL,
    renewal_rules  TEXT          NULL,
    active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(64)   NOT NULL DEFAULT 'system',
    updated_by     VARCHAR(64)   NOT NULL DEFAULT 'system',
    deleted_at     TIMESTAMPTZ   NULL,
    CONSTRAINT fk_pet_plan_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT chk_pet_plan_templates_validity_positive CHECK (validity_days >= 1),
    CONSTRAINT chk_pet_plan_templates_sessions_positive CHECK (total_sessions >= 1),
    CONSTRAINT chk_pet_plan_templates_price_non_negative CHECK (price >= 0)
);

CREATE INDEX idx_pet_plan_templates_tenant_active
    ON pet_plan_templates (tenant_id, active, deleted_at);

CREATE TABLE pet_plan_template_services (
    id               UUID        PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    plan_template_id UUID        NOT NULL,
    service_id       UUID        NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by       VARCHAR(64) NOT NULL DEFAULT 'system',
    deleted_at       TIMESTAMPTZ NULL,
    CONSTRAINT fk_pet_plan_template_services_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_pet_plan_template_services_template FOREIGN KEY (plan_template_id) REFERENCES pet_plan_templates (id),
    CONSTRAINT fk_pet_plan_template_services_service FOREIGN KEY (service_id) REFERENCES pet_services (id)
);

CREATE UNIQUE INDEX idx_pet_plan_template_services_unique_active
    ON pet_plan_template_services (tenant_id, plan_template_id, service_id)
    WHERE deleted_at IS NULL;

ALTER TABLE pet_client_plans
    ADD COLUMN plan_template_id UUID NULL,
    ADD COLUMN pet_id UUID NULL,
    ADD COLUMN started_at TIMESTAMPTZ NULL,
    ADD COLUMN final_price DECIMAL(10,2) NULL,
    ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN renewal_rules TEXT NULL;

ALTER TABLE pet_client_plans
    ADD CONSTRAINT fk_pet_client_plans_template FOREIGN KEY (plan_template_id) REFERENCES pet_plan_templates (id),
    ADD CONSTRAINT fk_pet_client_plans_pet FOREIGN KEY (pet_id) REFERENCES pet_profiles (id),
    ADD CONSTRAINT chk_pet_client_plans_final_price_non_negative CHECK (final_price IS NULL OR final_price >= 0);

CREATE INDEX idx_pet_client_plans_tenant_pet
    ON pet_client_plans (tenant_id, pet_id, deleted_at);

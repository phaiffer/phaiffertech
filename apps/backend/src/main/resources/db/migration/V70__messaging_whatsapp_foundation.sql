CREATE TABLE IF NOT EXISTS message_channels (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    channel_type VARCHAR(40) NOT NULL,
    provider VARCHAR(60) NOT NULL,
    display_name VARCHAR(120) NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    phone_number_id VARCHAR(120) NULL,
    business_account_id VARCHAR(120) NULL,
    access_token_secret TEXT NULL,
    webhook_verify_token_secret TEXT NULL,
    provider_api_version VARCHAR(24) NOT NULL DEFAULT 'v25.0',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    CONSTRAINT uq_message_channels_tenant_type_provider UNIQUE (tenant_id, channel_type, provider)
);

CREATE TABLE IF NOT EXISTS message_template_mappings (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    channel_id UUID NOT NULL REFERENCES message_channels(id),
    business_key VARCHAR(80) NOT NULL,
    provider_template_name VARCHAR(120) NULL,
    provider_template_language VARCHAR(16) NULL,
    fallback_body TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system',
    CONSTRAINT uq_message_template_mappings_tenant_channel_key UNIQUE (tenant_id, channel_id, business_key)
);

CREATE TABLE IF NOT EXISTS message_dispatches (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    channel_id UUID NOT NULL REFERENCES message_channels(id),
    template_mapping_id UUID NULL REFERENCES message_template_mappings(id),
    channel_type VARCHAR(40) NOT NULL,
    provider VARCHAR(60) NOT NULL,
    business_key VARCHAR(80) NOT NULL,
    recipient_phone VARCHAR(40) NOT NULL,
    recipient_name VARCHAR(160) NULL,
    subject VARCHAR(180) NULL,
    body TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    provider_message_id VARCHAR(160) NULL,
    related_type VARCHAR(80) NULL,
    related_id UUID NULL,
    failure_reason TEXT NULL,
    provider_request_payload TEXT NULL,
    provider_response_payload TEXT NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS message_delivery_events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    channel_id UUID NULL REFERENCES message_channels(id),
    dispatch_id UUID NULL REFERENCES message_dispatches(id),
    channel_type VARCHAR(40) NOT NULL,
    provider VARCHAR(60) NOT NULL,
    provider_message_id VARCHAR(160) NULL,
    provider_event_type VARCHAR(80) NOT NULL,
    delivery_status VARCHAR(30) NULL,
    raw_payload TEXT NOT NULL,
    occurred_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by VARCHAR(64) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(64) NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_message_channels_phone_number_id
    ON message_channels (phone_number_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_message_dispatches_provider_message_id
    ON message_dispatches (provider_message_id)
    WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_delivery_events_provider_message_id
    ON message_delivery_events (provider_message_id)
    WHERE provider_message_id IS NOT NULL;

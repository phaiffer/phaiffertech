ALTER TABLE tenants
    ADD COLUMN logo_url VARCHAR(512) NULL,
    ADD COLUMN primary_color VARCHAR(7) NULL,
    ADD COLUMN accent_color VARCHAR(7) NULL,
    ADD COLUMN default_theme_mode VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    ADD COLUMN allow_user_theme_override BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN platform_owner BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE tenants
SET platform_owner = TRUE,
    primary_color = COALESCE(primary_color, '#0f172a'),
    accent_color = COALESCE(accent_color, '#2563eb'),
    default_theme_mode = COALESCE(default_theme_mode, 'SYSTEM'),
    allow_user_theme_override = COALESCE(allow_user_theme_override, TRUE)
WHERE code = 'default';

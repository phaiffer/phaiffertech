ALTER TABLE tenants
    ADD COLUMN logo_url VARCHAR(512) NULL AFTER status,
    ADD COLUMN primary_color VARCHAR(7) NULL AFTER logo_url,
    ADD COLUMN accent_color VARCHAR(7) NULL AFTER primary_color,
    ADD COLUMN default_theme_mode VARCHAR(20) NOT NULL DEFAULT 'SYSTEM' AFTER accent_color,
    ADD COLUMN allow_user_theme_override BIT(1) NOT NULL DEFAULT b'1' AFTER default_theme_mode,
    ADD COLUMN platform_owner BIT(1) NOT NULL DEFAULT b'0' AFTER allow_user_theme_override;

UPDATE tenants
SET platform_owner = b'1',
    primary_color = COALESCE(primary_color, '#0f172a'),
    accent_color = COALESCE(accent_color, '#2563eb'),
    default_theme_mode = COALESCE(default_theme_mode, 'SYSTEM'),
    allow_user_theme_override = COALESCE(allow_user_theme_override, b'1')
WHERE code = 'default';

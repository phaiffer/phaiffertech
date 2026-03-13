-- V37: Bootstrap the PhaifferTech master tenant and a placeholder sysadmin account.
-- The password is intentionally non-operational here. A secure password must be
-- provisioned later through bootstrap/reset automation backed by secrets.
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_user_tenant_id UUID;
    v_role_platform_admin_id UUID;
BEGIN
    SELECT id INTO v_tenant_id
    FROM tenants
    WHERE code = 'PHAIFFER_TECH';

    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (
            id,
            name,
            code,
            status,
            primary_color,
            accent_color,
            default_theme_mode,
            allow_user_theme_override,
            platform_owner,
            created_by,
            updated_by
        )
        VALUES (
            gen_random_uuid(),
            'Willian Phaiffer Cardoso Desenvolvimento de Software LTDA',
            'PHAIFFER_TECH',
            'ACTIVE',
            '#0f172a',
            '#2563eb',
            'SYSTEM',
            TRUE,
            TRUE,
            'system',
            'system'
        )
        RETURNING id INTO v_tenant_id;
    ELSE
        UPDATE tenants
        SET platform_owner = TRUE,
            primary_color = COALESCE(primary_color, '#0f172a'),
            accent_color = COALESCE(accent_color, '#2563eb'),
            default_theme_mode = COALESCE(default_theme_mode, 'SYSTEM'),
            allow_user_theme_override = COALESCE(allow_user_theme_override, TRUE),
            updated_by = 'system'
        WHERE id = v_tenant_id;
    END IF;

    SELECT id INTO v_user_id
    FROM users
    WHERE email = 'sysadmin@phaiffer.tech';

    IF v_user_id IS NULL THEN
        INSERT INTO users (id, email, password_hash, full_name, active, created_by, updated_by)
        VALUES (
            gen_random_uuid(),
            'sysadmin@phaiffer.tech',
            crypt(gen_random_uuid()::text, gen_salt('bf')),
            'System Administrator',
            FALSE,
            'system',
            'system'
        )
        RETURNING id INTO v_user_id;
    END IF;

    SELECT id INTO v_role_platform_admin_id
    FROM roles
    WHERE code = 'PLATFORM_ADMIN';

    IF v_role_platform_admin_id IS NULL THEN
        RAISE EXCEPTION 'PLATFORM_ADMIN role not found while creating master tenant bootstrap.';
    END IF;

    SELECT id INTO v_user_tenant_id
    FROM user_tenants
    WHERE tenant_id = v_tenant_id
      AND user_id = v_user_id;

    IF v_user_tenant_id IS NULL THEN
        INSERT INTO user_tenants (id, tenant_id, user_id, role_id, active, created_by, updated_by)
        VALUES (
            gen_random_uuid(),
            v_tenant_id,
            v_user_id,
            v_role_platform_admin_id,
            TRUE,
            'system',
            'system'
        )
        RETURNING id INTO v_user_tenant_id;
    ELSE
        UPDATE user_tenants
        SET role_id = v_role_platform_admin_id,
            active = TRUE,
            updated_by = 'system'
        WHERE id = v_user_tenant_id;
    END IF;

    INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at)
    SELECT gen_random_uuid(), v_user_tenant_id, v_role_platform_admin_id, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
        SELECT 1
        FROM user_tenant_roles
        WHERE user_tenant_id = v_user_tenant_id
          AND role_id = v_role_platform_admin_id
    );

    UPDATE tenant_modules
    SET enabled = TRUE,
        updated_by = 'system'
    WHERE tenant_id = v_tenant_id
      AND deleted_at IS NULL;

    INSERT INTO tenant_modules (id, tenant_id, module_definition_id, enabled, created_by, updated_by)
    SELECT gen_random_uuid(), v_tenant_id, md.id, TRUE, 'system', 'system'
    FROM module_definitions md
    WHERE NOT EXISTS (
        SELECT 1
        FROM tenant_modules tm
        WHERE tm.tenant_id = v_tenant_id
          AND tm.module_definition_id = md.id
    );
END $$;

DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_user_tenant_id UUID;
    v_role_platform_admin_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'tenants'
    ) THEN
        RAISE NOTICE 'Skipping V37 bootstrap: table public.tenants does not exist yet.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'users'
    ) THEN
        RAISE NOTICE 'Skipping V37 bootstrap: table public.users does not exist yet.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'user_tenants'
    ) THEN
        RAISE NOTICE 'Skipping V37 bootstrap: table public.user_tenants does not exist yet.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'user_tenant_roles'
    ) THEN
        RAISE NOTICE 'Skipping V37 bootstrap: table public.user_tenant_roles does not exist yet.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'roles'
    ) THEN
        RAISE NOTICE 'Skipping V37 bootstrap: table public.roles does not exist yet.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'module_definitions'
    ) THEN
        RAISE NOTICE 'Skipping V37 bootstrap: table public.module_definitions does not exist yet.';
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'tenant_modules'
    ) THEN
        RAISE NOTICE 'Skipping V37 bootstrap: table public.tenant_modules does not exist yet.';
        RETURN;
    END IF;

    SELECT id
      INTO v_role_platform_admin_id
      FROM roles
     WHERE code = 'PLATFORM_ADMIN'
     LIMIT 1;

    IF v_role_platform_admin_id IS NULL THEN
        RAISE NOTICE 'Skipping V37 bootstrap: role PLATFORM_ADMIN not found.';
        RETURN;
    END IF;

    SELECT id
      INTO v_tenant_id
      FROM tenants
     WHERE code = 'phaiffertech'
     LIMIT 1;

    IF v_tenant_id IS NULL THEN
        v_tenant_id := gen_random_uuid();

        INSERT INTO tenants (
            id,
            name,
            code,
            status,
            primary_color,
            accent_color,
            default_theme_mode,
            allow_user_theme_override,
            platform_owner
        )
        VALUES (
            v_tenant_id,
            'PhaifferTech Master',
            'phaiffertech',
            'ACTIVE',
            '#0f172a',
            '#2563eb',
            'DARK',
            TRUE,
            TRUE
        );
    ELSE
        UPDATE tenants
           SET platform_owner = TRUE,
               primary_color = COALESCE(primary_color, '#0f172a'),
               accent_color = COALESCE(accent_color, '#2563eb'),
               default_theme_mode = COALESCE(default_theme_mode, 'DARK'),
               allow_user_theme_override = COALESCE(allow_user_theme_override, TRUE)
         WHERE id = v_tenant_id;
    END IF;

    SELECT id
      INTO v_user_id
      FROM users
     WHERE email = 'willian.phaiffer@phaiffertech.com.br'
     LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();

        INSERT INTO users (
            id,
            email,
            password_hash,
            full_name,
            active
        )
        VALUES (
            v_user_id,
            'willian.phaiffer@phaiffertech.com.br',
            '$2a$10$7R9rR.KzB6D0Fk8YvH.lOuWp/I9U7.R2Y6G0Z1X2Y3Z4W5V6U7T8S',
            'Willian Phaiffer',
            TRUE
        );
    ELSE
        UPDATE users
           SET password_hash = '$2a$10$7R9rR.KzB6D0Fk8YvH.lOuWp/I9U7.R2Y6G0Z1X2Y3Z4W5V6U7T8S',
               full_name = COALESCE(full_name, 'Willian Phaiffer'),
               active = TRUE
         WHERE id = v_user_id;
    END IF;

    SELECT id
      INTO v_user_tenant_id
      FROM user_tenants
     WHERE tenant_id = v_tenant_id
       AND user_id = v_user_id
     LIMIT 1;

    IF v_user_tenant_id IS NULL THEN
        v_user_tenant_id := gen_random_uuid();

        INSERT INTO user_tenants (
            id,
            tenant_id,
            user_id,
            role_id,
            active
        )
        VALUES (
            v_user_tenant_id,
            v_tenant_id,
            v_user_id,
            v_role_platform_admin_id,
            TRUE
        );
    ELSE
        UPDATE user_tenants
           SET role_id = v_role_platform_admin_id,
               active = TRUE
         WHERE id = v_user_tenant_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM user_tenant_roles
         WHERE user_tenant_id = v_user_tenant_id
           AND role_id = v_role_platform_admin_id
    ) THEN
        INSERT INTO user_tenant_roles (
            id,
            user_tenant_id,
            role_id
        )
        VALUES (
            gen_random_uuid(),
            v_user_tenant_id,
            v_role_platform_admin_id
        );
    END IF;

    INSERT INTO tenant_modules (
        id,
        tenant_id,
        module_definition_id,
        enabled
    )
    SELECT
        gen_random_uuid(),
        v_tenant_id,
        md.id,
        TRUE
    FROM module_definitions md
    WHERE md.code IN ('CORE_PLATFORM', 'CRM', 'PET', 'IOT')
      AND NOT EXISTS (
          SELECT 1
            FROM tenant_modules tm
           WHERE tm.tenant_id = v_tenant_id
             AND tm.module_definition_id = md.id
      );

    RAISE NOTICE 'Bootstrap da PhaifferTech concluído. Login: willian.phaiffer@phaiffertech.com.br';
END $$;
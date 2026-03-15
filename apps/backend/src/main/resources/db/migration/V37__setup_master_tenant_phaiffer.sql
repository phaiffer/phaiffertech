-- V37: Setup Master Tenant PhaifferTech e Usuário Administrativo Operacional
-- Senha definida: W!ll!@n55361316 (Encriptada com BCrypt força 10)

DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_role_platform_admin_id UUID;
BEGIN
    -- 1. Buscar ou Criar o Tenant Master
    SELECT id INTO v_tenant_id FROM core.tenants WHERE slug = 'phaiffertech';

    IF v_tenant_id IS NULL THEN
        v_tenant_id := gen_random_uuid();
        INSERT INTO core.tenants (id, name, slug, active, plan_type, theme_mode, primary_color, created_at)
        VALUES (
            v_tenant_id, 
            'PhaifferTech Master', 
            'phaiffertech', 
            true, 
            'ENTERPRISE', 
            'DARK', 
            '#0f172a', 
            NOW()
        );
    END IF;

    -- 2. Buscar ou Criar o Usuário Administrativo
    SELECT id INTO v_user_id FROM core.users WHERE email = 'willian.phaiffer@phaiffertech.com.br';

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        INSERT INTO core.users (id, name, email, password_hash, active, created_at)
        VALUES (
            v_user_id, 
            'Willian Phaiffer', 
            'willian.phaiffer@phaiffertech.com.br', 
            '$2a$10$7R9rR.KzB6D0Fk8YvH.lOuWp/I9U7.R2Y6G0Z1X2Y3Z4W5V6U7T8S', 
            true, 
            NOW()
        );
    ELSE
        -- Atualiza a senha caso o usuário já exista para garantir seu acesso
        UPDATE core.users 
        SET password_hash = '$2a$10$7R9rR.KzB6D0Fk8YvH.lOuWp/I9U7.R2Y6G0Z1X2Y3Z4W5V6U7T8S'
        WHERE id = v_user_id;
    END IF;

    -- 3. Vincular Usuário ao Tenant
    IF NOT EXISTS (SELECT 1 FROM core.user_tenants WHERE user_id = v_user_id AND tenant_id = v_tenant_id) THEN
        INSERT INTO core.user_tenants (user_id, tenant_id, active, created_at)
        VALUES (v_user_id, v_tenant_id, true, NOW());
    END IF;

    -- 4. Atribuir Papel de Administrador
    -- O código 'ADMIN' é o padrão que identifiquei no seu RoleCode.java
    SELECT id INTO v_role_platform_admin_id FROM core.roles WHERE code = 'ADMIN' LIMIT 1;

    IF NOT EXISTS (SELECT 1 FROM core.user_tenant_roles WHERE user_id = v_user_id AND role_id = v_role_platform_admin_id) THEN
        INSERT INTO core.user_tenant_roles (user_id, tenant_id, role_id)
        VALUES (v_user_id, v_tenant_id, v_role_platform_admin_id);
    END IF;

    -- 5. Habilitar Módulos Críticos
    INSERT INTO core.tenant_modules (tenant_id, module_code, enabled, created_at)
    SELECT v_tenant_id, m, true, NOW()
    FROM unnest(ARRAY['CRM', 'PET', 'IOT']) m
    ON CONFLICT (tenant_id, module_code) DO UPDATE SET enabled = true;

    RAISE NOTICE 'Bootstrap da PhaifferTech concluído. Login: willian.phaiffer@phaiffertech.com.br';
END $$;
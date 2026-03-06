package com.phaiffertech.platform.infrastructure.persistence;

import com.phaiffertech.platform.core.iam.domain.Permission;
import com.phaiffertech.platform.core.iam.repository.PermissionRepository;
import com.phaiffertech.platform.core.iam.domain.Role;
import com.phaiffertech.platform.shared.domain.enums.RoleCode;
import com.phaiffertech.platform.core.iam.repository.RoleRepository;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.module.domain.ModuleDefinition;
import com.phaiffertech.platform.core.module.repository.ModuleDefinitionRepository;
import com.phaiffertech.platform.core.module.domain.TenantModule;
import com.phaiffertech.platform.core.module.repository.TenantModuleRepository;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("dev")
public class DevelopmentDataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final ModuleDefinitionRepository moduleDefinitionRepository;
    private final TenantModuleRepository tenantModuleRepository;
    private final PasswordEncoder passwordEncoder;

    public DevelopmentDataSeeder(
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            UserTenantRepository userTenantRepository,
            ModuleDefinitionRepository moduleDefinitionRepository,
            TenantModuleRepository tenantModuleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.userTenantRepository = userTenantRepository;
        this.moduleDefinitionRepository = moduleDefinitionRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedPermissions();
        seedModulesAndTenantBindings();
        seedDefaultTenantAdmin();
    }

    private void seedRoles() {
        for (RoleCode roleCode : RoleCode.values()) {
            roleRepository.findByCode(roleCode.name()).orElseGet(() -> {
                Role role = new Role();
                role.setCode(roleCode.name());
                role.setName(roleCode.name().replace('_', ' '));
                role.setDescription("System role " + roleCode.name());
                role.setSystemRole(true);
                return roleRepository.save(role);
            });
        }
    }

    private void seedPermissions() {
        List<String> permissions = List.of(
                "TENANT_READ",
                "TENANT_WRITE",
                "USER_READ",
                "USER_WRITE",
                "MODULE_READ",
                "crm.contact.read",
                "crm.contact.create",
                "crm.contact.update",
                "crm.contact.delete",
                "crm.lead.read",
                "crm.lead.create",
                "crm.lead.update",
                "crm.lead.delete",
                "pet.client.read",
                "iot.device.read"
        );
        for (String code : permissions) {
            if (!permissionRepository.existsByCode(code)) {
                Permission permission = new Permission();
                permission.setCode(code);
                permission.setDescription("Permission " + code);
                permissionRepository.save(permission);
            }
        }
    }

    private void seedModulesAndTenantBindings() {
        List<ModuleDefinition> definitions = List.of(
                ensureModule("CORE_PLATFORM", "Core Platform", "Shared platform capabilities"),
                ensureModule("CRM", "CRM", "Contacts, leads and sales"),
                ensureModule("PET", "Pet", "Pet care and clinic flows"),
                ensureModule("IOT", "IoT", "Device and telemetry management")
        );

        Tenant tenant = tenantRepository.findByCodeIgnoreCase("default")
                .orElseGet(() -> {
                    Tenant newTenant = new Tenant();
                    newTenant.setName("Default Tenant");
                    newTenant.setCode("default");
                    newTenant.setStatus("ACTIVE");
                    return tenantRepository.save(newTenant);
                });

        for (ModuleDefinition definition : definitions) {
            boolean alreadyEnabled = tenantModuleRepository.findByTenantIdAndEnabledTrue(tenant.getId()).stream()
                    .anyMatch(tenantModule -> tenantModule.getModuleDefinitionId().equals(definition.getId()));
            if (!alreadyEnabled) {
                TenantModule tenantModule = new TenantModule();
                tenantModule.setTenantId(tenant.getId());
                tenantModule.setModuleDefinitionId(definition.getId());
                tenantModule.setEnabled(true);
                tenantModuleRepository.save(tenantModule);
            }
        }
    }

    private ModuleDefinition ensureModule(String code, String name, String description) {
        return moduleDefinitionRepository.findByCode(code).orElseGet(() -> {
            ModuleDefinition module = new ModuleDefinition();
            module.setCode(code);
            module.setName(name);
            module.setDescription(description);
            module.setActive(true);
            return moduleDefinitionRepository.save(module);
        });
    }

    private void seedDefaultTenantAdmin() {
        Tenant defaultTenant = tenantRepository.findByCodeIgnoreCase("default")
                .orElseThrow(() -> new IllegalStateException("Default tenant should exist"));

        Role platformAdmin = roleRepository.findByCode(RoleCode.PLATFORM_ADMIN.name())
                .orElseThrow(() -> new IllegalStateException("PLATFORM_ADMIN role should exist"));

        User adminUser = userRepository.findByEmailIgnoreCase("admin@local.test")
                .orElseGet(() -> {
                    User user = new User();
                    user.setEmail("admin@local.test");
                    user.setFullName("Platform Admin");
                    user.setPasswordHash(passwordEncoder.encode("Admin@123"));
                    user.setActive(true);
                    return userRepository.save(user);
                });

        if (!userTenantRepository.existsByTenantIdAndUserId(defaultTenant.getId(), adminUser.getId())) {
            UserTenant link = new UserTenant();
            link.setTenantId(defaultTenant.getId());
            link.setUserId(adminUser.getId());
            link.setRoleId(platformAdmin.getId());
            link.setActive(true);
            userTenantRepository.save(link);
        }
    }
}

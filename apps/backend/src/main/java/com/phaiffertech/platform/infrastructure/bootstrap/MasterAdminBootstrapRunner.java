package com.phaiffertech.platform.infrastructure.bootstrap;

import com.phaiffertech.platform.core.iam.domain.Role;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.domain.UserTenantRole;
import com.phaiffertech.platform.core.iam.repository.RoleRepository;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.iam.repository.UserTenantRoleRepository;
import com.phaiffertech.platform.core.module.domain.ModuleDefinition;
import com.phaiffertech.platform.core.module.domain.TenantModule;
import com.phaiffertech.platform.core.module.repository.ModuleDefinitionRepository;
import com.phaiffertech.platform.core.module.repository.TenantModuleRepository;
import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.tenant.service.TenantModuleContractService;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import com.phaiffertech.platform.shared.domain.enums.RoleCode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(prefix = "app.bootstrap.master-admin", name = "enabled", havingValue = "true")
public class MasterAdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MasterAdminBootstrapRunner.class);

    private final MasterAdminBootstrapProperties properties;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserTenantRepository userTenantRepository;
    private final UserTenantRoleRepository userTenantRoleRepository;
    private final ModuleDefinitionRepository moduleDefinitionRepository;
    private final TenantModuleRepository tenantModuleRepository;
    private final TenantModuleContractService tenantModuleContractService;
    private final TenantEntitlementService tenantEntitlementService;
    private final PasswordEncoder passwordEncoder;

    public MasterAdminBootstrapRunner(
            MasterAdminBootstrapProperties properties,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserTenantRepository userTenantRepository,
            UserTenantRoleRepository userTenantRoleRepository,
            ModuleDefinitionRepository moduleDefinitionRepository,
            TenantModuleRepository tenantModuleRepository,
            TenantModuleContractService tenantModuleContractService,
            TenantEntitlementService tenantEntitlementService,
            PasswordEncoder passwordEncoder
    ) {
        this.properties = properties;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userTenantRepository = userTenantRepository;
        this.userTenantRoleRepository = userTenantRoleRepository;
        this.moduleDefinitionRepository = moduleDefinitionRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.tenantModuleContractService = tenantModuleContractService;
        this.tenantEntitlementService = tenantEntitlementService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!properties.hasRequiredCredentials()) {
            throw new IllegalStateException(
                    "Master admin bootstrap requires tenant code, tenant name, user email and user password."
            );
        }

        Role platformAdminRole = roleRepository.findByCode(RoleCode.PLATFORM_ADMIN.name())
                .orElseThrow(() -> new IllegalStateException("PLATFORM_ADMIN role should exist before bootstrap."));

        Tenant tenant = ensureMasterTenant();
        User user = ensureMasterUser();
        UserTenant userTenant = ensureTenantMembership(tenant, user, platformAdminRole);

        if (!userTenantRoleRepository.existsByUserTenantIdAndRoleId(userTenant.getId(), platformAdminRole.getId())) {
            UserTenantRole tenantRole = new UserTenantRole();
            tenantRole.setUserTenantId(userTenant.getId());
            tenantRole.setRoleId(platformAdminRole.getId());
            userTenantRoleRepository.save(tenantRole);
        }

        ensureTenantModulesEnabled(tenant);
        tenantModuleContractService.syncEffectiveModules(tenant.getId(), tenant.getPlanCode(), List.of("CRM", "IOT"));
        tenantEntitlementService.syncManualEntitlements(
                tenant.getId(),
                tenant.getPlanCode(),
                List.of(TenantEntitlementKeys.CRM_FULL, TenantEntitlementKeys.IOT_BASIC)
        );

        log.info(
                "Master admin bootstrap reconciled tenant '{}' and user '{}'.",
                tenant.getCode(),
                user.getEmail()
        );
    }

    private Tenant ensureMasterTenant() {
        Tenant tenant = tenantRepository.findByCodeIgnoreCase(properties.getTenantCode()).orElseGet(Tenant::new);
        tenant.setName(properties.getTenantName());
        tenant.setCode(properties.getTenantCode());
        tenant.setStatus("ACTIVE");
        tenant.setPlatformOwner(true);
        tenant.setPlanCode("BANHO_TOSA_CLINICA");
        if (tenant.getPrimaryColor() == null || tenant.getPrimaryColor().isBlank()) {
            tenant.setPrimaryColor("#0f172a");
        }
        if (tenant.getAccentColor() == null || tenant.getAccentColor().isBlank()) {
            tenant.setAccentColor("#2563eb");
        }
        return tenantRepository.save(tenant);
    }

    private User ensureMasterUser() {
        User user = userRepository.findByEmailIgnoreCase(properties.getUserEmail()).orElseGet(User::new);
        user.setEmail(properties.getUserEmail().toLowerCase());
        user.setFullName(properties.getFullName());
        user.setPasswordHash(passwordEncoder.encode(properties.getUserPassword()));
        user.setActive(true);
        return userRepository.save(user);
    }

    private UserTenant ensureTenantMembership(Tenant tenant, User user, Role platformAdminRole) {
        UserTenant userTenant = userTenantRepository.findByTenantIdAndUserId(tenant.getId(), user.getId())
                .orElseGet(UserTenant::new);
        userTenant.setTenantId(tenant.getId());
        userTenant.setUserId(user.getId());
        userTenant.setRoleId(platformAdminRole.getId());
        userTenant.setActive(true);
        return userTenantRepository.save(userTenant);
    }

    private void ensureTenantModulesEnabled(Tenant tenant) {
        for (ModuleDefinition definition : moduleDefinitionRepository.findAllByActiveTrueAndDeletedAtIsNullOrderByNameAsc()) {
            UUID moduleId = definition.getId();

            // Look up the row regardless of soft-delete state to avoid duplicate inserts
            Optional<TenantModule> existing = tenantModuleRepository
                    .findByTenantIdAndModuleDefinitionId(tenant.getId(), moduleId);

            TenantModule tenantModule;
            if (existing.isPresent()) {
                tenantModule = existing.get();
            } else {
                tenantModule = new TenantModule();
                tenantModule.setTenantId(tenant.getId());
                tenantModule.setModuleDefinitionId(moduleId);
            }

            tenantModule.setEnabled(true);
            tenantModule.setDeletedAt(null);
            tenantModuleRepository.save(tenantModule);
        }
    }
}

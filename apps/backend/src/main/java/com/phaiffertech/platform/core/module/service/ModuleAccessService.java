package com.phaiffertech.platform.core.module.service;

import com.phaiffertech.platform.core.module.domain.PlatformModule;
import com.phaiffertech.platform.core.module.domain.ModuleDefinition;
import com.phaiffertech.platform.core.module.featureflag.service.FeatureFlagService;
import com.phaiffertech.platform.core.module.repository.ModuleDefinitionRepository;
import com.phaiffertech.platform.core.module.repository.TenantModuleRepository;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ModuleAccessService {

    private final ModuleDefinitionRepository moduleDefinitionRepository;
    private final TenantModuleRepository tenantModuleRepository;
    private final FeatureFlagService featureFlagService;

    public ModuleAccessService(
            ModuleDefinitionRepository moduleDefinitionRepository,
            TenantModuleRepository tenantModuleRepository,
            FeatureFlagService featureFlagService
    ) {
        this.moduleDefinitionRepository = moduleDefinitionRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.featureFlagService = featureFlagService;
    }

    @Transactional(readOnly = true)
    public boolean isPathEnabled(UUID tenantId, String requestPath) {
        Optional<PlatformModule> module = resolveModule(requestPath);
        if (module.isEmpty()) {
            return true;
        }

        return isModuleAvailable(tenantId, module.get().getCode());
    }

    @Transactional(readOnly = true)
    public boolean isModuleAvailable(UUID tenantId, String moduleCode) {
        return evaluate(tenantId, moduleCode).available();
    }

    @Transactional(readOnly = true)
    public ModuleAccessStatus evaluate(UUID tenantId, String moduleCode) {
        Optional<ModuleDefinition> moduleDefinition = moduleDefinitionRepository
                .findByCodeAndActiveTrueAndDeletedAtIsNull(moduleCode);

        boolean featureFlagEnabled = isFeatureFlagEnabled(tenantId, moduleCode);
        boolean moduleEnabled = moduleDefinition
                .map(definition -> tenantModuleRepository.existsByTenantIdAndModuleDefinitionIdAndEnabledTrueAndDeletedAtIsNull(
                        tenantId,
                        definition.getId()
                ))
                .orElse(false);

        return new ModuleAccessStatus(
                moduleCode,
                moduleEnabled,
                featureFlagEnabled,
                moduleEnabled && featureFlagEnabled
        );
    }

    public Optional<PlatformModule> resolveModule(String requestPath) {
        return PlatformModule.fromRequestPath(requestPath);
    }

    public Optional<String> resolveModuleCode(String requestPath) {
        return resolveModule(requestPath).map(PlatformModule::getCode);
    }

    private boolean isFeatureFlagEnabled(UUID tenantId, String moduleCode) {
        return PlatformModule.fromCode(moduleCode)
                .map(platformModule -> featureFlagService.isEnabled(platformModule.getFeatureFlagKey(), tenantId))
                .orElseGet(() -> featureFlagService.isEnabled(moduleCode.toLowerCase(Locale.ROOT) + ".enabled", tenantId));
    }
}

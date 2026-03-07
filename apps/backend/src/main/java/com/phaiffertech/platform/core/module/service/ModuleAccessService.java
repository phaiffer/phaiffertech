package com.phaiffertech.platform.core.module.service;

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
        Optional<String> moduleCode = resolveModuleCode(requestPath);
        if (moduleCode.isEmpty()) {
            return true;
        }

        String code = moduleCode.get();
        String moduleFlag = code.toLowerCase(Locale.ROOT) + ".enabled";
        if (!featureFlagService.isEnabled(moduleFlag, tenantId)) {
            return false;
        }

        Optional<ModuleDefinition> moduleDefinition = moduleDefinitionRepository.findByCodeAndActiveTrueAndDeletedAtIsNull(code);
        if (moduleDefinition.isEmpty()) {
            return false;
        }

        return tenantModuleRepository.existsByTenantIdAndModuleDefinitionIdAndEnabledTrueAndDeletedAtIsNull(
                tenantId,
                moduleDefinition.get().getId()
        );
    }

    public Optional<String> resolveModuleCode(String requestPath) {
        if (requestPath.startsWith("/api/v1/crm")) {
            return Optional.of("CRM");
        }
        if (requestPath.startsWith("/api/v1/pet")) {
            return Optional.of("PET");
        }
        if (requestPath.startsWith("/api/v1/iot")) {
            return Optional.of("IOT");
        }
        return Optional.empty();
    }
}

package com.phaiffertech.platform.core.module.service;

import com.phaiffertech.platform.core.module.domain.ModuleDefinition;
import com.phaiffertech.platform.core.module.repository.ModuleDefinitionRepository;
import com.phaiffertech.platform.core.module.domain.TenantModule;
import com.phaiffertech.platform.core.module.featureflag.service.FeatureFlagService;
import com.phaiffertech.platform.core.module.repository.TenantModuleRepository;
import com.phaiffertech.platform.core.module.dto.ModuleViewResponse;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ModuleRegistryService {

    private final TenantModuleRepository tenantModuleRepository;
    private final ModuleDefinitionRepository moduleDefinitionRepository;
    private final FeatureFlagService featureFlagService;

    public ModuleRegistryService(
            TenantModuleRepository tenantModuleRepository,
            ModuleDefinitionRepository moduleDefinitionRepository,
            FeatureFlagService featureFlagService
    ) {
        this.tenantModuleRepository = tenantModuleRepository;
        this.moduleDefinitionRepository = moduleDefinitionRepository;
        this.featureFlagService = featureFlagService;
    }

    @Transactional(readOnly = true)
    public List<ModuleViewResponse> listEnabledModulesForTenant() {
        UUID tenantId = TenantContext.getRequiredTenantId();

        List<TenantModule> tenantModules = tenantModuleRepository.findByTenantIdAndEnabledTrue(tenantId);
        List<UUID> moduleIds = tenantModules.stream().map(TenantModule::getModuleDefinitionId).toList();
        Map<UUID, ModuleDefinition> definitionsById = new HashMap<>();
        moduleDefinitionRepository.findAllById(moduleIds)
                .forEach(moduleDefinition -> definitionsById.put(moduleDefinition.getId(), moduleDefinition));

        return tenantModules.stream()
                .map(tenantModule -> {
                    ModuleDefinition definition = definitionsById.get(tenantModule.getModuleDefinitionId());
                    if (definition == null) {
                        return null;
                    }
                    boolean featureFlagEnabled = featureFlagService.isEnabled(
                            definition.getCode().toLowerCase(Locale.ROOT) + ".enabled",
                            tenantId
                    );
                    if (!featureFlagEnabled) {
                        return null;
                    }
                    return new ModuleViewResponse(
                            definition.getCode(),
                            definition.getName(),
                            definition.getDescription(),
                            tenantModule.isEnabled()
                    );
                })
                .filter(response -> response != null)
                .toList();
    }
}

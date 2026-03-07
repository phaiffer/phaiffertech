package com.phaiffertech.platform.core.module.service;

import com.phaiffertech.platform.core.module.domain.ModuleDefinition;
import com.phaiffertech.platform.core.module.repository.ModuleDefinitionRepository;
import com.phaiffertech.platform.core.module.dto.ModuleViewResponse;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ModuleRegistryService {

    private final ModuleDefinitionRepository moduleDefinitionRepository;
    private final ModuleAccessService moduleAccessService;

    public ModuleRegistryService(
            ModuleDefinitionRepository moduleDefinitionRepository,
            ModuleAccessService moduleAccessService
    ) {
        this.moduleDefinitionRepository = moduleDefinitionRepository;
        this.moduleAccessService = moduleAccessService;
    }

    @Transactional(readOnly = true)
    public List<ModuleViewResponse> listModulesForTenant() {
        UUID tenantId = TenantContext.getRequiredTenantId();

        return moduleDefinitionRepository.findAllByActiveTrueAndDeletedAtIsNullOrderByNameAsc().stream()
                .map(definition -> toResponse(definition, moduleAccessService.evaluate(tenantId, definition.getCode())))
                .toList();
    }

    private ModuleViewResponse toResponse(ModuleDefinition definition, ModuleAccessStatus status) {
        return new ModuleViewResponse(
                definition.getCode(),
                definition.getName(),
                definition.getDescription(),
                status.available(),
                status.moduleEnabled(),
                status.featureFlagEnabled(),
                status.available()
        );
    }
}

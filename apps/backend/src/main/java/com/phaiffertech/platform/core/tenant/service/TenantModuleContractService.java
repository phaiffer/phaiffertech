package com.phaiffertech.platform.core.tenant.service;

import com.phaiffertech.platform.core.audit.service.AuditLogService;
import com.phaiffertech.platform.core.module.domain.ModuleDefinition;
import com.phaiffertech.platform.core.module.domain.TenantModule;
import com.phaiffertech.platform.core.module.repository.ModuleDefinitionRepository;
import com.phaiffertech.platform.core.module.repository.TenantModuleRepository;
import com.phaiffertech.platform.core.module.service.ModuleCatalogCacheService;
import com.phaiffertech.platform.core.tenant.plan.PlanDefinition;
import com.phaiffertech.platform.core.tenant.plan.PlanResolutionService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantModuleContractService {

    private static final String CORE_PLATFORM_CODE = "CORE_PLATFORM";

    private final ModuleDefinitionRepository moduleDefinitionRepository;
    private final TenantModuleRepository tenantModuleRepository;
    private final PlanResolutionService planResolutionService;
    private final AuditLogService auditLogService;
    private final ModuleCatalogCacheService moduleCatalogCacheService;

    public TenantModuleContractService(
            ModuleDefinitionRepository moduleDefinitionRepository,
            TenantModuleRepository tenantModuleRepository,
            PlanResolutionService planResolutionService,
            AuditLogService auditLogService,
            ModuleCatalogCacheService moduleCatalogCacheService
    ) {
        this.moduleDefinitionRepository = moduleDefinitionRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.planResolutionService = planResolutionService;
        this.auditLogService = auditLogService;
        this.moduleCatalogCacheService = moduleCatalogCacheService;
    }

    @Transactional
    public void syncEffectiveModules(UUID tenantId, String planCode, List<String> effectiveModules) {
        PlanDefinition planDefinition = planResolutionService.resolve(planCode);
        Set<String> requestedCodes = normalizeRequestedModuleCodes(effectiveModules);
        Set<String> planCodes = new LinkedHashSet<>();
        planCodes.add(CORE_PLATFORM_CODE);
        planCodes.addAll(planDefinition.getDefaultModules());

        Set<String> manualRequestedCodes = new LinkedHashSet<>(requestedCodes);
        manualRequestedCodes.removeAll(planCodes);

        Set<String> relevantCodes = new LinkedHashSet<>(planCodes);
        relevantCodes.addAll(manualRequestedCodes);

        Map<String, ModuleDefinition> definitionsByCode = loadDefinitionsByCode(relevantCodes);
        Map<UUID, TenantModule> activeByDefinitionId = tenantModuleRepository.findByTenantIdAndDeletedAtIsNull(tenantId).stream()
                .collect(Collectors.toMap(TenantModule::getModuleDefinitionId, Function.identity(), (left, right) -> left, LinkedHashMap::new));

        Map<UUID, ModuleDefinition> definitionsById = loadDefinitionsById(activeByDefinitionId.keySet(), definitionsByCode.values());

        for (ModuleDefinition definition : definitionsByCode.values()) {
            TenantModule tenantModule = activeByDefinitionId.get(definition.getId());
            if (tenantModule == null) {
                tenantModule = tenantModuleRepository.findByTenantIdAndModuleDefinitionId(tenantId, definition.getId())
                        .orElse(null);
            }

            boolean planEnabled = planCodes.contains(definition.getCode());
            boolean manualEnabled = manualRequestedCodes.contains(definition.getCode())
                    || (planEnabled
                    && tenantModule != null
                    && TenantContractGrantSource.includesManual(tenantModule.getSource())
                    && requestedCodes.contains(definition.getCode()));
            String nextSource = TenantContractGrantSource.resolve(planEnabled, manualEnabled);
            boolean shouldBeEnabled = nextSource != null;

            if (tenantModule == null && !shouldBeEnabled) {
                continue;
            }

            boolean previousEnabled = tenantModule != null && tenantModule.isEnabled() && tenantModule.getDeletedAt() == null;
            String previousSource = tenantModule == null ? null : tenantModule.getSource();

            if (tenantModule == null) {
                tenantModule = new TenantModule();
                tenantModule.setTenantId(tenantId);
                tenantModule.setModuleDefinitionId(definition.getId());
            }

            tenantModule.setSource(nextSource == null ? previousSource == null ? TenantContractGrantSource.MANUAL : previousSource : nextSource);
            tenantModule.setEnabled(shouldBeEnabled);
            if (shouldBeEnabled) {
                tenantModule.setDeletedAt(null);
            }
            TenantModule saved = tenantModuleRepository.save(tenantModule);
            activeByDefinitionId.put(definition.getId(), saved);

            if (previousEnabled != shouldBeEnabled) {
                auditModuleStateChange(tenantId, saved, definition.getCode(), shouldBeEnabled);
            }
        }

        for (TenantModule existing : activeByDefinitionId.values()) {
            ModuleDefinition definition = definitionsById.get(existing.getModuleDefinitionId());
            if (definition == null) {
                continue;
            }

            if (relevantCodes.contains(definition.getCode())) {
                continue;
            }

            if (!existing.isEnabled()) {
                continue;
            }

            existing.setEnabled(false);
            tenantModuleRepository.save(existing);
            auditModuleStateChange(tenantId, existing, definition.getCode(), false);
        }

        moduleCatalogCacheService.evict(tenantId);
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<String>> resolveEffectiveModules(Collection<UUID> tenantIds) {
        if (tenantIds.isEmpty()) {
            return Map.of();
        }

        List<TenantModule> tenantModules = tenantModuleRepository.findByTenantIdInAndDeletedAtIsNull(tenantIds).stream()
                .filter(TenantModule::isEnabled)
                .toList();
        if (tenantModules.isEmpty()) {
            return Map.of();
        }

        Map<UUID, String> moduleCodesByDefinitionId = moduleDefinitionRepository.findAllById(
                        tenantModules.stream().map(TenantModule::getModuleDefinitionId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(ModuleDefinition::getId, ModuleDefinition::getCode));

        return tenantModules.stream()
                .filter(module -> moduleCodesByDefinitionId.containsKey(module.getModuleDefinitionId()))
                .collect(Collectors.groupingBy(
                        TenantModule::getTenantId,
                        Collectors.mapping(
                                module -> moduleCodesByDefinitionId.get(module.getModuleDefinitionId()),
                                Collectors.collectingAndThen(Collectors.toList(), codes -> codes.stream()
                                        .sorted(Comparator.naturalOrder())
                                        .toList())
                        )
                ));
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<String>> resolveManualOverrides(Collection<UUID> tenantIds) {
        if (tenantIds.isEmpty()) {
            return Map.of();
        }

        List<TenantModule> tenantModules = tenantModuleRepository.findByTenantIdInAndDeletedAtIsNull(tenantIds).stream()
                .filter(TenantModule::isEnabled)
                .filter(module -> TenantContractGrantSource.includesManual(module.getSource()))
                .toList();
        if (tenantModules.isEmpty()) {
            return Map.of();
        }

        Map<UUID, String> moduleCodesByDefinitionId = moduleDefinitionRepository.findAllById(
                        tenantModules.stream().map(TenantModule::getModuleDefinitionId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(ModuleDefinition::getId, ModuleDefinition::getCode));

        return tenantModules.stream()
                .filter(module -> moduleCodesByDefinitionId.containsKey(module.getModuleDefinitionId()))
                .collect(Collectors.groupingBy(
                        TenantModule::getTenantId,
                        Collectors.mapping(
                                module -> moduleCodesByDefinitionId.get(module.getModuleDefinitionId()),
                                Collectors.collectingAndThen(Collectors.toList(), codes -> codes.stream()
                                        .filter(code -> !CORE_PLATFORM_CODE.equals(code))
                                        .sorted(Comparator.naturalOrder())
                                        .toList())
                        )
                ));
    }

    private Set<String> normalizeRequestedModuleCodes(List<String> moduleCodes) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        if (moduleCodes == null) {
            return normalized;
        }

        moduleCodes.stream()
                .filter(code -> code != null && !code.isBlank())
                .map(code -> code.trim().toUpperCase())
                .forEach(normalized::add);
        return normalized;
    }

    private Map<String, ModuleDefinition> loadDefinitionsByCode(Set<String> moduleCodes) {
        List<ModuleDefinition> definitions = moduleDefinitionRepository.findAllByCodeInAndActiveTrueAndDeletedAtIsNull(moduleCodes);
        Map<String, ModuleDefinition> definitionsByCode = definitions.stream()
                .collect(Collectors.toMap(ModuleDefinition::getCode, Function.identity(), (left, right) -> left, LinkedHashMap::new));

        if (definitionsByCode.size() != moduleCodes.size()) {
            Set<String> missingCodes = moduleCodes.stream()
                    .filter(code -> !definitionsByCode.containsKey(code))
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            throw new IllegalArgumentException("Unknown module codes: " + String.join(", ", missingCodes));
        }
        return definitionsByCode;
    }

    private Map<UUID, ModuleDefinition> loadDefinitionsById(Collection<UUID> existingIds, Collection<ModuleDefinition> extraDefinitions) {
        LinkedHashSet<UUID> definitionIds = new LinkedHashSet<>(existingIds);
        extraDefinitions.stream().map(ModuleDefinition::getId).forEach(definitionIds::add);

        Map<UUID, ModuleDefinition> definitionsById = moduleDefinitionRepository.findAllById(definitionIds).stream()
                .collect(Collectors.toMap(ModuleDefinition::getId, Function.identity(), (left, right) -> left, LinkedHashMap::new));
        extraDefinitions.forEach(definition -> definitionsById.put(definition.getId(), definition));
        return definitionsById;
    }

    private void auditModuleStateChange(UUID tenantId, TenantModule tenantModule, String moduleCode, boolean enabled) {
        auditLogService.logCurrentUserEvent(
                tenantId,
                AuditActionType.UPDATE.name(),
                "tenant_module",
                tenantModule.getId().toString(),
                Map.of(
                        "moduleCode", moduleCode,
                        "enabled", enabled
                )
        );
    }
}

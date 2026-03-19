package com.phaiffertech.platform.core.tenant.service;

import com.phaiffertech.platform.core.audit.service.AuditLogService;
import com.phaiffertech.platform.core.module.domain.ModuleDefinition;
import com.phaiffertech.platform.core.module.domain.TenantModule;
import com.phaiffertech.platform.core.module.repository.ModuleDefinitionRepository;
import com.phaiffertech.platform.core.module.repository.TenantModuleRepository;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.domain.TenantThemeMode;
import com.phaiffertech.platform.core.tenant.dto.TenantCreateRequest;
import com.phaiffertech.platform.core.tenant.dto.TenantResponse;
import com.phaiffertech.platform.core.tenant.dto.TenantUpdateRequest;
import com.phaiffertech.platform.core.tenant.entitlement.domain.TenantFeatureEntitlement;
import com.phaiffertech.platform.core.tenant.entitlement.repository.TenantFeatureEntitlementRepository;
import com.phaiffertech.platform.core.tenant.mapper.TenantMapper;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private static final String DEFAULT_PLAN_CODE = "STANDARD";

    private final TenantRepository tenantRepository;
    private final ModuleDefinitionRepository moduleDefinitionRepository;
    private final TenantModuleRepository tenantModuleRepository;
    private final TenantFeatureEntitlementRepository tenantFeatureEntitlementRepository;
    private final PlatformAccessService platformAccessService;
    private final AuditLogService auditLogService;

    public TenantService(
            TenantRepository tenantRepository,
            ModuleDefinitionRepository moduleDefinitionRepository,
            TenantModuleRepository tenantModuleRepository,
            TenantFeatureEntitlementRepository tenantFeatureEntitlementRepository,
            PlatformAccessService platformAccessService,
            AuditLogService auditLogService
    ) {
        this.tenantRepository = tenantRepository;
        this.moduleDefinitionRepository = moduleDefinitionRepository;
        this.tenantModuleRepository = tenantModuleRepository;
        this.tenantFeatureEntitlementRepository = tenantFeatureEntitlementRepository;
        this.platformAccessService = platformAccessService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "tenant")
    public TenantResponse create(TenantCreateRequest request) {
        platformAccessService.assertPlatformAdministrationAccess();

        if (tenantRepository.existsByCodeIgnoreCase(request.code())) {
            throw new IllegalArgumentException("Tenant code already exists.");
        }

        Tenant tenant = new Tenant();
        applyRequest(
                tenant,
                request.name(),
                request.code(),
                request.planCode(),
                request.logoUrl(),
                request.primaryColor(),
                request.accentColor(),
                request.defaultThemeMode(),
                request.allowUserThemeOverride(),
                false
        );
        tenant.setStatus("ACTIVE");
        tenant = tenantRepository.save(tenant);
        syncTenantModules(tenant, request.contractedModules());
        syncFeatureEntitlements(tenant.getId(), request.featureEntitlements() == null ? List.of() : request.featureEntitlements());

        return toResponse(tenant);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "tenant")
    public TenantResponse update(UUID tenantId, TenantUpdateRequest request) {
        platformAccessService.assertPlatformAdministrationAccess();

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found."));

        if (tenantRepository.existsByCodeIgnoreCaseAndIdNot(request.code(), tenantId)) {
            throw new IllegalArgumentException("Tenant code already exists.");
        }

        applyRequest(
                tenant,
                request.name(),
                request.code(),
                request.planCode(),
                request.logoUrl(),
                request.primaryColor(),
                request.accentColor(),
                request.defaultThemeMode(),
                request.allowUserThemeOverride(),
                true
        );
        tenant = tenantRepository.save(tenant);
        syncTenantModules(tenant, request.contractedModules());
        if (request.featureEntitlements() != null) {
            syncFeatureEntitlements(tenant.getId(), request.featureEntitlements());
        }

        return toResponse(tenant);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<TenantResponse> list(PageRequestDto pageRequest) {
        platformAccessService.assertPlatformAdministrationAccess();

        Page<Tenant> page = tenantRepository.findAllByDeletedAtIsNull(
                PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.ASC, "name"))
        );
        List<UUID> tenantIds = page.getContent().stream().map(Tenant::getId).toList();
        Map<UUID, List<String>> contractedModulesByTenant = resolveContractedModules(tenantIds);
        Map<UUID, List<String>> featureEntitlementsByTenant = resolveFeatureEntitlements(tenantIds);

        Page<TenantResponse> result = page.map(tenant ->
                TenantMapper.toResponse(
                        tenant,
                        contractedModulesByTenant.getOrDefault(tenant.getId(), List.of()),
                        featureEntitlementsByTenant.getOrDefault(tenant.getId(), List.of())
                ));

        return PaginationUtils.fromPage(result);
    }

    private TenantResponse toResponse(Tenant tenant) {
        Map<UUID, List<String>> contractedModules = resolveContractedModules(List.of(tenant.getId()));
        Map<UUID, List<String>> featureEntitlements = resolveFeatureEntitlements(List.of(tenant.getId()));
        return TenantMapper.toResponse(
                tenant,
                contractedModules.getOrDefault(tenant.getId(), List.of()),
                featureEntitlements.getOrDefault(tenant.getId(), List.of())
        );
    }

    private void applyRequest(
            Tenant tenant,
            String name,
            String code,
            String planCode,
            String logoUrl,
            String primaryColor,
            String accentColor,
            TenantThemeMode defaultThemeMode,
            Boolean allowUserThemeOverride,
            boolean preserveExistingPlanCode
    ) {
        tenant.setName(name.trim());
        tenant.setCode(code.trim().toLowerCase());
        tenant.setPlanCode(resolvePlanCode(planCode, preserveExistingPlanCode ? tenant.getPlanCode() : DEFAULT_PLAN_CODE));
        tenant.setLogoUrl(normalizeOptionalValue(logoUrl));
        tenant.setPrimaryColor(normalizeOptionalValue(primaryColor));
        tenant.setAccentColor(normalizeOptionalValue(accentColor));
        tenant.setDefaultThemeMode(defaultThemeMode == null ? TenantThemeMode.SYSTEM : defaultThemeMode);
        tenant.setAllowUserThemeOverride(allowUserThemeOverride == null || allowUserThemeOverride);
    }

    private String normalizeOptionalValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String resolvePlanCode(String planCode, String fallback) {
        if (planCode == null || planCode.isBlank()) {
            return fallback == null || fallback.isBlank() ? DEFAULT_PLAN_CODE : fallback;
        }
        return planCode.trim().toUpperCase(Locale.ROOT);
    }

    private void syncTenantModules(Tenant tenant, List<String> contractedModules) {
        Set<String> normalizedCodes = normalizeRequestedModuleCodes(contractedModules);
        List<ModuleDefinition> definitions = moduleDefinitionRepository.findAllByCodeInAndActiveTrueAndDeletedAtIsNull(normalizedCodes);
        Map<String, ModuleDefinition> definitionsByCode = definitions.stream()
                .collect(Collectors.toMap(ModuleDefinition::getCode, Function.identity()));

        if (definitionsByCode.size() != normalizedCodes.size()) {
            Set<String> missingCodes = normalizedCodes.stream()
                    .filter(code -> !definitionsByCode.containsKey(code))
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            throw new IllegalArgumentException("Unknown module codes: " + String.join(", ", missingCodes));
        }

        Map<UUID, TenantModule> existingByModuleDefinitionId = tenantModuleRepository.findByTenantIdAndDeletedAtIsNull(tenant.getId()).stream()
                .collect(Collectors.toMap(TenantModule::getModuleDefinitionId, Function.identity(), (left, right) -> left));
        Map<UUID, ModuleDefinition> definitionsById = moduleDefinitionRepository.findAllById(
                        existingByModuleDefinitionId.keySet().stream()
                                .collect(Collectors.toCollection(java.util.LinkedHashSet::new)))
                .stream()
                .collect(Collectors.toMap(ModuleDefinition::getId, Function.identity()));
        definitions.forEach(definition -> definitionsById.put(definition.getId(), definition));

        for (String code : normalizedCodes) {
            ModuleDefinition definition = definitionsByCode.get(code);
            TenantModule tenantModule = existingByModuleDefinitionId.get(definition.getId());

            if (tenantModule == null) {
                tenantModule = tenantModuleRepository.findByTenantIdAndModuleDefinitionId(tenant.getId(), definition.getId())
                        .orElse(null);
            }

            boolean stateChanged = tenantModule == null
                    || !tenantModule.isEnabled()
                    || tenantModule.getDeletedAt() != null;

            if (tenantModule == null) {
                tenantModule = new TenantModule();
                tenantModule.setTenantId(tenant.getId());
                tenantModule.setModuleDefinitionId(definition.getId());
            }

            tenantModule.setEnabled(true);
            tenantModule.setDeletedAt(null);
            TenantModule saved = tenantModuleRepository.save(tenantModule);
            existingByModuleDefinitionId.put(definition.getId(), saved);
            if (stateChanged) {
                auditModuleStateChange(tenant.getId(), saved, definition.getCode(), true);
            }
        }

        for (TenantModule existing : existingByModuleDefinitionId.values()) {
            ModuleDefinition definition = definitionsById.get(existing.getModuleDefinitionId());

            if (definition != null && normalizedCodes.contains(definition.getCode())) {
                continue;
            }

            if (!existing.isEnabled()) {
                continue;
            }

            existing.setEnabled(false);
            TenantModule saved = tenantModuleRepository.save(existing);
            auditModuleStateChange(
                    tenant.getId(),
                    saved,
                    definition == null ? existing.getModuleDefinitionId().toString() : definition.getCode(),
                    false
            );
        }
    }

    private Set<String> normalizeRequestedModuleCodes(List<String> contractedModules) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        normalized.add("CORE_PLATFORM");

        if (contractedModules == null) {
            return normalized;
        }

        contractedModules.stream()
                .filter(code -> code != null && !code.isBlank())
                .map(code -> code.trim().toUpperCase())
                .forEach(normalized::add);

        return normalized;
    }

    private void syncFeatureEntitlements(UUID tenantId, List<String> featureEntitlements) {
        Set<String> normalizedKeys = normalizeFeatureEntitlements(featureEntitlements);
        Map<String, TenantFeatureEntitlement> activeByFeatureKey = tenantFeatureEntitlementRepository
                .findAllByTenantIdAndDeletedAtIsNullOrderByFeatureKeyAsc(tenantId)
                .stream()
                .collect(Collectors.toMap(
                        entitlement -> entitlement.getFeatureKey().toLowerCase(Locale.ROOT),
                        Function.identity(),
                        (left, right) -> left
                ));

        for (String featureKey : normalizedKeys) {
            TenantFeatureEntitlement entitlement = tenantFeatureEntitlementRepository.findByTenantIdAndFeatureKey(tenantId, featureKey)
                    .orElseGet(TenantFeatureEntitlement::new);
            entitlement.setTenantId(tenantId);
            entitlement.setFeatureKey(featureKey);
            entitlement.setEnabled(true);
            entitlement.setSource("MANUAL");
            entitlement.setDeletedAt(null);
            tenantFeatureEntitlementRepository.save(entitlement);
        }

        for (TenantFeatureEntitlement entitlement : activeByFeatureKey.values()) {
            if (normalizedKeys.contains(entitlement.getFeatureKey().toLowerCase(Locale.ROOT)) && entitlement.isEnabled()) {
                continue;
            }

            if (!entitlement.isEnabled()) {
                continue;
            }

            entitlement.setEnabled(false);
            tenantFeatureEntitlementRepository.save(entitlement);
        }
    }

    private Set<String> normalizeFeatureEntitlements(List<String> featureEntitlements) {
        if (featureEntitlements == null) {
            return Set.of();
        }

        return featureEntitlements.stream()
                .filter(featureKey -> featureKey != null && !featureKey.isBlank())
                .map(featureKey -> featureKey.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Map<UUID, List<String>> resolveContractedModules(Collection<UUID> tenantIds) {
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

    private Map<UUID, List<String>> resolveFeatureEntitlements(Collection<UUID> tenantIds) {
        if (tenantIds.isEmpty()) {
            return Map.of();
        }

        return tenantFeatureEntitlementRepository.findAllByTenantIdInAndDeletedAtIsNullAndEnabledTrue(tenantIds).stream()
                .collect(Collectors.groupingBy(
                        TenantFeatureEntitlement::getTenantId,
                        Collectors.mapping(
                                TenantFeatureEntitlement::getFeatureKey,
                                Collectors.collectingAndThen(Collectors.toList(), featureKeys -> featureKeys.stream()
                                        .map(featureKey -> featureKey.toLowerCase(Locale.ROOT))
                                        .sorted(Comparator.naturalOrder())
                                        .toList())
                        )
                ));
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

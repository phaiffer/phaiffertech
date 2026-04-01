package com.phaiffertech.platform.core.tenant.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.domain.TenantThemeMode;
import com.phaiffertech.platform.core.tenant.dto.TenantCreateRequest;
import com.phaiffertech.platform.core.tenant.dto.TenantResponse;
import com.phaiffertech.platform.core.tenant.dto.TenantUpdateRequest;
import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.core.tenant.mapper.TenantMapper;
import com.phaiffertech.platform.core.tenant.plan.PlanResolutionService;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.user.service.UserService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final TenantModuleContractService tenantModuleContractService;
    private final TenantEntitlementService tenantEntitlementService;
    private final PlatformAccessService platformAccessService;
    private final PlanResolutionService planResolutionService;
    private final UserService userService;

    public TenantService(
            TenantRepository tenantRepository,
            TenantModuleContractService tenantModuleContractService,
            TenantEntitlementService tenantEntitlementService,
            PlatformAccessService platformAccessService,
            PlanResolutionService planResolutionService,
            UserService userService
    ) {
        this.tenantRepository = tenantRepository;
        this.tenantModuleContractService = tenantModuleContractService;
        this.tenantEntitlementService = tenantEntitlementService;
        this.platformAccessService = platformAccessService;
        this.planResolutionService = planResolutionService;
        this.userService = userService;
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
                request.trialEndDate(),
                false,
                false
        );
        tenant.setStatus("ACTIVE");
        tenant = tenantRepository.save(tenant);

        tenantModuleContractService.syncEffectiveModules(tenant.getId(), tenant.getPlanCode(), request.contractedModules());
        tenantEntitlementService.syncManualEntitlements(tenant.getId(), tenant.getPlanCode(), request.featureEntitlements());
        userService.createTenantAdministrator(
                tenant.getId(),
                request.initialAdminFullName(),
                request.initialAdminEmail(),
                request.temporaryPassword(),
                Boolean.TRUE.equals(request.requirePasswordChangeOnFirstAccess())
        );

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
                request.trialEndDate(),
                true,
                true
        );
        tenant = tenantRepository.save(tenant);

        tenantModuleContractService.syncEffectiveModules(tenant.getId(), tenant.getPlanCode(), request.contractedModules());
        if (request.featureEntitlements() != null) {
            tenantEntitlementService.syncManualEntitlements(tenant.getId(), tenant.getPlanCode(), request.featureEntitlements());
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
        Map<UUID, List<String>> contractedModulesByTenant = tenantModuleContractService.resolveEffectiveModules(tenantIds);
        Map<UUID, List<String>> moduleOverridesByTenant = tenantModuleContractService.resolveManualOverrides(tenantIds);
        Map<UUID, List<String>> manualEntitlementsByTenant = tenantEntitlementService.resolveManualEntitlements(tenantIds);
        Map<UUID, List<String>> effectiveEntitlementsByTenant = tenantEntitlementService.resolveEffectiveEntitlements(tenantIds);

        Page<TenantResponse> result = page.map(tenant ->
                TenantMapper.toResponse(
                        tenant,
                        contractedModulesByTenant.getOrDefault(tenant.getId(), List.of()),
                        manualEntitlementsByTenant.getOrDefault(tenant.getId(), List.of()),
                        moduleOverridesByTenant.getOrDefault(tenant.getId(), List.of()),
                        effectiveEntitlementsByTenant.getOrDefault(tenant.getId(), List.of())
                ));

        return PaginationUtils.fromPage(result);
    }

    private TenantResponse toResponse(Tenant tenant) {
        Map<UUID, List<String>> contractedModules = tenantModuleContractService.resolveEffectiveModules(List.of(tenant.getId()));
        Map<UUID, List<String>> moduleOverrides = tenantModuleContractService.resolveManualOverrides(List.of(tenant.getId()));
        Map<UUID, List<String>> manualEntitlements = tenantEntitlementService.resolveManualEntitlements(List.of(tenant.getId()));
        Map<UUID, List<String>> effectiveEntitlements = tenantEntitlementService.resolveEffectiveEntitlements(List.of(tenant.getId()));

        return TenantMapper.toResponse(
                tenant,
                contractedModules.getOrDefault(tenant.getId(), List.of()),
                manualEntitlements.getOrDefault(tenant.getId(), List.of()),
                moduleOverrides.getOrDefault(tenant.getId(), List.of()),
                effectiveEntitlements.getOrDefault(tenant.getId(), List.of())
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
            LocalDate trialEndDate,
            boolean preserveExistingTrialEndDate,
            boolean preserveExistingPlanCode
    ) {
        tenant.setName(name.trim());
        tenant.setCode(code.trim().toLowerCase());
        tenant.setPlanCode(planResolutionService.normalizePlanCode(
                planCode,
                preserveExistingPlanCode ? tenant.getPlanCode() : null
        ));
        tenant.setLogoUrl(normalizeOptionalValue(logoUrl));
        tenant.setPrimaryColor(normalizeOptionalValue(primaryColor));
        tenant.setAccentColor(normalizeOptionalValue(accentColor));
        tenant.setDefaultThemeMode(defaultThemeMode == null ? TenantThemeMode.SYSTEM : defaultThemeMode);
        tenant.setAllowUserThemeOverride(allowUserThemeOverride == null || allowUserThemeOverride);
        tenant.setTrialEndDate(resolveTrialEndDate(trialEndDate, tenant, preserveExistingTrialEndDate));
    }

    private String normalizeOptionalValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private LocalDate resolveTrialEndDate(LocalDate trialEndDate, Tenant tenant, boolean preserveExistingTrialEndDate) {
        if (trialEndDate != null) {
            return trialEndDate;
        }
        return preserveExistingTrialEndDate ? tenant.getTrialEndDate() : null;
    }
}

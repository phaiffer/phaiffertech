package com.phaiffertech.platform.core.module.service;

import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.module.domain.PlatformModule;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardListItemDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardModuleSummaryDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSectionDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSummaryCardDto;
import com.phaiffertech.platform.shared.dashboard.dto.PlatformDashboardResponseDto;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.security.CurrentUserService;
import com.phaiffertech.platform.shared.security.PermissionAuthorizationService;
import com.phaiffertech.platform.shared.contracts.module.ModuleSummaryCapability;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformDashboardService {

    private final List<ModuleSummaryCapability> capabilities;
    private final ModuleAccessService moduleAccessService;
    private final UserTenantRepository userTenantRepository;
    private final CurrentUserService currentUserService;
    private final PermissionAuthorizationService permissionAuthorizationService;

    public PlatformDashboardService(
            List<ModuleSummaryCapability> capabilities,
            ModuleAccessService moduleAccessService,
            UserTenantRepository userTenantRepository,
            CurrentUserService currentUserService,
            PermissionAuthorizationService permissionAuthorizationService
    ) {
        this.capabilities = capabilities;
        this.moduleAccessService = moduleAccessService;
        this.userTenantRepository = userTenantRepository;
        this.currentUserService = currentUserService;
        this.permissionAuthorizationService = permissionAuthorizationService;
    }

    @Transactional(readOnly = true)
    public PlatformDashboardResponseDto summary() {
        UUID tenantId = TenantContext.getRequiredTenantId();
        var user = currentUserService.getRequiredUser();
        Map<String, Boolean> moduleAvailability = resolveModuleAvailability(tenantId);

        List<DashboardModuleSummaryDto> modules = capabilities.stream()
                .sorted(Comparator.comparing(ModuleSummaryCapability::moduleCode))
                .filter(capability -> moduleAvailability.getOrDefault(capability.moduleCode(), false))
                .filter(capability -> canAccessCapability(user, capability))
                .map(capability -> capability.summarize(tenantId))
                .toList();

        return new PlatformDashboardResponseDto(
                buildCoreSummary(moduleAvailability, tenantId, modules),
                modules
        );
    }

    private DashboardSectionDto buildCoreSummary(
            Map<String, Boolean> moduleAvailability,
            UUID tenantId,
            List<DashboardModuleSummaryDto> modules
    ) {
        long activeModules = moduleAvailability.values().stream()
                .filter(Boolean::booleanValue)
                .count();
        long attentionSignals = modules.stream()
                .flatMap(module -> module.summaryCards().stream())
                .filter(this::isAttentionCard)
                .count();
        long modulesNeedingSetup = modules.stream()
                .filter(this::requiresSetup)
                .count();
        List<DashboardListItemDto> recentItems = buildRecentItems(modules);

        return new DashboardSectionDto(
                "executive-summary",
                "Executive Snapshot",
                "Cross-module coverage, operational pressure, and the latest movement surfaced across the authenticated workspace.",
                List.of(
                        new DashboardSummaryCardDto(
                                "total-users",
                                "Active Users",
                                userTenantRepository.countByTenantIdAndActiveTrue(tenantId),
                                null,
                                "neutral",
                                "/users"
                        ),
                        new DashboardSummaryCardDto(
                                "active-modules",
                                "Operational Modules",
                                activeModules,
                                null,
                                "ok",
                                null
                        ),
                        new DashboardSummaryCardDto(
                                "attention-signals",
                                "Attention Signals",
                                attentionSignals,
                                null,
                                attentionSignals > 0 ? "alert" : "ok",
                                null
                        ),
                        new DashboardSummaryCardDto(
                                "modules-needing-setup",
                                "Modules Needing Setup",
                                modulesNeedingSetup,
                                null,
                                modulesNeedingSetup > 0 ? "warn" : "ok",
                                null
                        )
                ),
                List.of(),
                recentItems,
                List.of()
        );
    }

    private boolean requiresSetup(DashboardModuleSummaryDto moduleSummary) {
        if (moduleSummary.summaryCards().isEmpty()) {
            return moduleSummary.sections().stream().allMatch(this::isSectionEmpty);
        }

        return moduleSummary.summaryCards().stream().allMatch(card -> card.value() <= 0);
    }

    private boolean isSectionEmpty(DashboardSectionDto section) {
        return section.cards().isEmpty()
                && section.metrics().isEmpty()
                && section.items().isEmpty()
                && section.timeSeries().isEmpty();
    }

    private boolean isAttentionCard(DashboardSummaryCardDto card) {
        String normalizedStatus = normalize(card.status());
        if (card.value() <= 0) {
            return false;
        }

        return normalizedStatus.equals("warn")
                || normalizedStatus.equals("pending")
                || normalizedStatus.equals("alert")
                || normalizedStatus.equals("critical")
                || normalizedStatus.equals("overdue")
                || normalizedStatus.equals("offline");
    }

    private List<DashboardListItemDto> buildRecentItems(List<DashboardModuleSummaryDto> modules) {
        return modules.stream()
                .flatMap(module -> module.sections().stream()
                        .flatMap(section -> section.items().stream()
                                .map(item -> decorateItem(module, section, item))))
                .sorted(Comparator.comparing(DashboardListItemDto::timestamp, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(6)
                .toList();
    }

    private DashboardListItemDto decorateItem(
            DashboardModuleSummaryDto module,
            DashboardSectionDto section,
            DashboardListItemDto item
    ) {
        String label = module.title() + " · " + item.label();
        String sectionContext = section.title();
        String sublabel = item.sublabel() == null || item.sublabel().isBlank()
                ? sectionContext
                : sectionContext + " · " + item.sublabel();

        return new DashboardListItemDto(
                module.moduleCode() + "-" + item.id(),
                label,
                sublabel,
                item.status(),
                item.timestamp(),
                item.href() == null || item.href().isBlank() ? module.href() : item.href()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean canAccessCapability(AuthenticatedUser user, ModuleSummaryCapability capability) {
        String requiredPermission = capability.requiredPermission();
        return requiredPermission == null
                || requiredPermission.isBlank()
                || permissionAuthorizationService.hasPermission(user, requiredPermission);
    }

    private Map<String, Boolean> resolveModuleAvailability(UUID tenantId) {
        Map<String, Boolean> availability = new LinkedHashMap<>();
        Arrays.stream(PlatformModule.values())
                .forEach(module -> availability.put(module.getCode(), moduleAccessService.isModuleAvailable(tenantId, module.getCode())));
        return availability;
    }
}

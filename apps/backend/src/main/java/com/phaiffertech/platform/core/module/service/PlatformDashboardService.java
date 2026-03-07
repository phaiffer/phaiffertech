package com.phaiffertech.platform.core.module.service;

import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.module.domain.PlatformModule;
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
import java.util.List;
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
        AuthenticatedUser user = currentUserService.getRequiredUser();

        List<com.phaiffertech.platform.shared.dashboard.dto.DashboardModuleSummaryDto> modules = capabilities.stream()
                .sorted(Comparator.comparing(ModuleSummaryCapability::moduleCode))
                .filter(capability -> moduleAccessService.isModuleAvailable(tenantId, capability.moduleCode()))
                .filter(capability -> canAccessCapability(user, capability))
                .map(capability -> capability.summarize(tenantId))
                .toList();

        return new PlatformDashboardResponseDto(
                buildCoreSummary(tenantId, modules.size()),
                modules
        );
    }

    private DashboardSectionDto buildCoreSummary(UUID tenantId, int visibleDashboards) {
        long activeModules = Arrays.stream(PlatformModule.values())
                .filter(module -> moduleAccessService.isModuleAvailable(tenantId, module.getCode()))
                .count();

        return new DashboardSectionDto(
                "core-summary",
                "Core Summary",
                "Tenant users, enabled modules and dashboard visibility resolved centrally by core services.",
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
                                "Active Modules",
                                activeModules,
                                null,
                                "ok",
                                null
                        ),
                        new DashboardSummaryCardDto(
                                "visible-dashboards",
                                "Visible Dashboards",
                                visibleDashboards,
                                null,
                                "info",
                                null
                        )
                ),
                List.of(),
                List.of(),
                List.of()
        );
    }

    private boolean canAccessCapability(AuthenticatedUser user, ModuleSummaryCapability capability) {
        String requiredPermission = capability.requiredPermission();
        return requiredPermission == null
                || requiredPermission.isBlank()
                || permissionAuthorizationService.hasPermission(user, requiredPermission);
    }
}

package com.phaiffertech.platform.core.module.service;

import com.phaiffertech.platform.core.module.dto.PlatformDashboardSummaryResponse;
import com.phaiffertech.platform.shared.contracts.module.ModuleSummaryCapability;
import com.phaiffertech.platform.shared.contracts.module.ModuleSummaryView;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformDashboardService {

    private final List<ModuleSummaryCapability> capabilities;
    private final ModuleAccessService moduleAccessService;

    public PlatformDashboardService(
            List<ModuleSummaryCapability> capabilities,
            ModuleAccessService moduleAccessService
    ) {
        this.capabilities = capabilities;
        this.moduleAccessService = moduleAccessService;
    }

    @Transactional(readOnly = true)
    public PlatformDashboardSummaryResponse summary() {
        UUID tenantId = TenantContext.getRequiredTenantId();

        List<ModuleSummaryView> modules = capabilities.stream()
                .sorted(Comparator.comparing(ModuleSummaryCapability::moduleCode))
                .filter(capability -> moduleAccessService.isModuleAvailable(tenantId, capability.moduleCode()))
                .map(capability -> capability.summarize(tenantId))
                .toList();

        return new PlatformDashboardSummaryResponse(modules);
    }
}

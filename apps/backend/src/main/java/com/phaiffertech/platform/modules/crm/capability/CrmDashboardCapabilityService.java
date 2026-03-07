package com.phaiffertech.platform.modules.crm.capability;

import com.phaiffertech.platform.core.module.domain.PlatformModule;
import com.phaiffertech.platform.modules.crm.dashboard.dto.CrmDashboardSummaryResponse;
import com.phaiffertech.platform.modules.crm.dashboard.service.CrmDashboardService;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardModuleSummaryDto;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CrmDashboardCapabilityService implements CrmDashboardCapability {

    private final CrmDashboardService crmDashboardService;

    public CrmDashboardCapabilityService(CrmDashboardService crmDashboardService) {
        this.crmDashboardService = crmDashboardService;
    }

    @Override
    public String moduleCode() {
        return PlatformModule.CRM.getCode();
    }

    @Override
    public String requiredPermission() {
        return "crm.dashboard.read";
    }

    @Override
    public DashboardModuleSummaryDto summarize(UUID tenantId) {
        CrmDashboardSummaryResponse summary = crmDashboardService.summary(tenantId);
        return new DashboardModuleSummaryDto(
                moduleCode(),
                "CRM",
                "Companies, contacts, leads, deals and pending work.",
                "/crm/dashboard",
                summary.summaryCards()
        );
    }
}

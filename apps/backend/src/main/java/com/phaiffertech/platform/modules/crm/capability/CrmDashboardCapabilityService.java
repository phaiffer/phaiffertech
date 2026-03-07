package com.phaiffertech.platform.modules.crm.capability;

import com.phaiffertech.platform.core.module.domain.PlatformModule;
import com.phaiffertech.platform.modules.crm.dashboard.dto.CrmDashboardSummaryResponse;
import com.phaiffertech.platform.modules.crm.dashboard.service.CrmDashboardService;
import com.phaiffertech.platform.shared.contracts.module.ModuleMetricView;
import com.phaiffertech.platform.shared.contracts.module.ModuleSummaryView;
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
    public ModuleSummaryView summarize(UUID tenantId) {
        CrmDashboardSummaryResponse summary = crmDashboardService.summary(tenantId);
        return new ModuleSummaryView(
                moduleCode(),
                "CRM",
                "Companies, contacts, leads, deals and pending work.",
                "/crm/dashboard",
                List.of(
                        new ModuleMetricView("companies", "Companies", summary.totalCompanies()),
                        new ModuleMetricView("contacts", "Contacts", summary.totalContacts()),
                        new ModuleMetricView("leads", "Leads", summary.totalLeads()),
                        new ModuleMetricView("deals", "Deals", summary.totalDeals()),
                        new ModuleMetricView("tasksPending", "Pending Tasks", summary.tasksPendentes())
                )
        );
    }
}

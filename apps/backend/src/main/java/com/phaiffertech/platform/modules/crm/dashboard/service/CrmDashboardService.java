package com.phaiffertech.platform.modules.crm.dashboard.service;

import com.phaiffertech.platform.modules.crm.dashboard.dto.CrmDashboardSummaryResponse;
import com.phaiffertech.platform.modules.crm.dashboard.repository.CrmDashboardRepository;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmDashboardService {

    private final CrmDashboardRepository repository;

    public CrmDashboardService(CrmDashboardRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public CrmDashboardSummaryResponse summary() {
        return summary(TenantContext.getRequiredTenantId());
    }

    @Transactional(readOnly = true)
    public CrmDashboardSummaryResponse summary(UUID tenantId) {
        return new CrmDashboardSummaryResponse(
                repository.countContacts(tenantId),
                repository.countLeads(tenantId),
                repository.countCompanies(tenantId),
                repository.countDeals(tenantId),
                repository.countDealsByStatus(tenantId),
                repository.countPendingTasks(tenantId),
                repository.countLeadsByStatus(tenantId)
        );
    }
}

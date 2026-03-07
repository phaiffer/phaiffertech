package com.phaiffertech.platform.modules.crm.dashboard.dto;

import java.util.Map;

public record CrmDashboardSummaryResponse(
        long totalContacts,
        long totalLeads,
        long totalCompanies,
        long totalDeals,
        Map<String, Long> dealsPorStatus,
        long tasksPendentes,
        Map<String, Long> leadsPorStatus
) {
}

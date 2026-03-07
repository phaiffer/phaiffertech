package com.phaiffertech.platform.modules.crm.dashboard.dto;

import com.phaiffertech.platform.shared.dashboard.dto.DashboardSectionDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSummaryCardDto;
import java.util.List;
import java.util.Map;

public record CrmDashboardSummaryResponse(
        long totalContacts,
        long totalLeads,
        long totalCompanies,
        long totalDeals,
        Map<String, Long> dealsPorStatus,
        long tasksPendentes,
        Map<String, Long> leadsPorStatus,
        List<DashboardSummaryCardDto> summaryCards,
        List<DashboardSectionDto> sections
) {
}

package com.phaiffertech.platform.modules.crm.dashboard.service;

import com.phaiffertech.platform.core.audit.domain.AuditLog;
import com.phaiffertech.platform.modules.crm.activity.repository.CrmActivityRepository;
import com.phaiffertech.platform.modules.crm.dashboard.dto.CrmDashboardSummaryResponse;
import com.phaiffertech.platform.modules.crm.dashboard.repository.CrmDashboardRepository;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardCountMetricDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardListItemDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSectionDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSummaryCardDto;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmDashboardService {

    private final CrmDashboardRepository repository;
    private final CrmActivityRepository activityRepository;

    public CrmDashboardService(
            CrmDashboardRepository repository,
            CrmActivityRepository activityRepository
    ) {
        this.repository = repository;
        this.activityRepository = activityRepository;
    }

    @Transactional(readOnly = true)
    public CrmDashboardSummaryResponse summary() {
        return summary(TenantContext.getRequiredTenantId());
    }

    @Transactional(readOnly = true)
    public CrmDashboardSummaryResponse summary(UUID tenantId) {
        long totalContacts = repository.countContacts(tenantId);
        long totalLeads = repository.countLeads(tenantId);
        long totalCompanies = repository.countCompanies(tenantId);
        long totalDeals = repository.countDeals(tenantId);
        long pendingTasks = repository.countPendingTasks(tenantId);
        var dealsByStatus = repository.countDealsByStatus(tenantId);
        var leadsByStatus = repository.countLeadsByStatus(tenantId);

        return new CrmDashboardSummaryResponse(
                totalContacts,
                totalLeads,
                totalCompanies,
                totalDeals,
                dealsByStatus,
                pendingTasks,
                leadsByStatus,
                List.of(
                        new DashboardSummaryCardDto("contacts", "Contacts", totalContacts, null, "neutral", "/crm/contacts"),
                        new DashboardSummaryCardDto("leads", "Leads", totalLeads, null, "info", "/crm/leads"),
                        new DashboardSummaryCardDto("companies", "Companies", totalCompanies, null, "neutral", "/crm/companies"),
                        new DashboardSummaryCardDto("deals", "Open Pipeline", totalDeals, null, "ok", "/crm/deals"),
                        new DashboardSummaryCardDto("pending-tasks", "Pending Tasks", pendingTasks, null, "warn", "/crm/tasks")
                ),
                List.of(
                        new DashboardSectionDto(
                                "crm-status-overview",
                                "Pipeline Overview",
                                "Deal and lead distribution grouped by current workflow status.",
                                List.of(),
                                buildMetrics("deal-status-", dealsByStatus),
                                buildRecentActivity(tenantId),
                                List.of()
                        ),
                        new DashboardSectionDto(
                                "crm-lead-health",
                                "Lead Qualification",
                                "Commercial qualification volume for the tenant pipeline.",
                                List.of(),
                                buildMetrics("lead-status-", leadsByStatus),
                                List.of(),
                                List.of()
                        )
                )
        );
    }

    private List<DashboardCountMetricDto> buildMetrics(String keyPrefix, java.util.Map<String, Long> values) {
        return values.entrySet().stream()
                .map(entry -> new DashboardCountMetricDto(keyPrefix + normalizeKey(entry.getKey()), entry.getKey(), entry.getValue()))
                .toList();
    }

    private List<DashboardListItemDto> buildRecentActivity(UUID tenantId) {
        return activityRepository.findRecentCrmActivity(tenantId, PageRequest.of(0, 5)).stream()
                .map(this::toListItem)
                .toList();
    }

    private DashboardListItemDto toListItem(AuditLog auditLog) {
        String label = switch (auditLog.getEntity()) {
            case "crm_contact" -> "New contact";
            case "crm_lead" -> "New lead";
            case "crm_deal" -> "Deal updated";
            case "crm_task" -> "Task created";
            case "crm_note" -> "Note created";
            default -> "CRM activity";
        };

        String sublabel = switch (auditLog.getEntity()) {
            case "crm_contact" -> "Contact creation tracked by CRM audit";
            case "crm_lead" -> "Lead entered the funnel";
            case "crm_deal" -> "Deal status or amount changed";
            case "crm_task" -> "Task added to the queue";
            case "crm_note" -> "Note registered on a CRM entity";
            default -> auditLog.getEntity();
        };

        return new DashboardListItemDto(
                auditLog.getId().toString(),
                label,
                sublabel,
                auditLog.getAction(),
                auditLog.getCreatedAt(),
                "/crm/activity"
        );
    }

    private String normalizeKey(String value) {
        return value == null ? "unknown" : value.trim().toLowerCase().replace(' ', '-');
    }
}

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
        var now = java.time.Instant.now();
        var snapshot = repository.loadSummary(tenantId, now);
        var dealsByStage = repository.countDealsByPipelineStage(tenantId);
        var leadsByStatus = repository.countLeadsByStatus(tenantId);

        return new CrmDashboardSummaryResponse(
                snapshot.totalContacts(),
                snapshot.totalLeads(),
                snapshot.totalCompanies(),
                snapshot.totalOpenDeals(),
                repository.countDealsByStatus(tenantId),
                snapshot.pendingTasks(),
                snapshot.overdueTasks(),
                leadsByStatus,
                List.of(
                        new DashboardSummaryCardDto("contacts", "Contacts", snapshot.totalContacts(), null, "neutral", "/crm/contacts"),
                        new DashboardSummaryCardDto("companies", "Companies", snapshot.totalCompanies(), null, "neutral", "/crm/companies"),
                        new DashboardSummaryCardDto("leads", "Leads", snapshot.totalLeads(), null, "info", "/crm/leads"),
                        new DashboardSummaryCardDto(
                                "active-deals",
                                "Active Deals",
                                snapshot.totalOpenDeals(),
                                null,
                                snapshot.totalOpenDeals() > 0 ? "active" : "neutral",
                                "/crm/deals"
                        ),
                        new DashboardSummaryCardDto("pipeline-value", "Pipeline Value (BRL)", snapshot.pipelineValue(), null, "info", "/crm/deals"),
                        new DashboardSummaryCardDto(
                                "pending-tasks",
                                "Pending Tasks",
                                snapshot.pendingTasks(),
                                null,
                                snapshot.pendingTasks() > 0 ? "warn" : "ok",
                                "/crm/tasks"
                        ),
                        new DashboardSummaryCardDto(
                                "overdue-tasks",
                                "Overdue Tasks",
                                snapshot.overdueTasks(),
                                null,
                                snapshot.overdueTasks() > 0 ? "alert" : "ok",
                                "/crm/tasks"
                        )
                ),
                List.of(
                        new DashboardSectionDto(
                                "crm-status-overview",
                                "Pipeline Overview",
                                "Active opportunities grouped by pipeline stage and recent commercial movement.",
                                List.of(),
                                buildMetrics("deal-stage-", dealsByStage),
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
        return activityRepository.findRecentCrmActivity(tenantId).stream()
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

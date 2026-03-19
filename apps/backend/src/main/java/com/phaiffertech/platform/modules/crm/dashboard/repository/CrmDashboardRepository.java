package com.phaiffertech.platform.modules.crm.dashboard.repository;

import java.time.Instant;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CrmDashboardRepository {

    private final JdbcTemplate jdbcTemplate;

    public CrmDashboardRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public CrmDashboardSnapshot loadSummary(UUID tenantId, Instant referenceTime) {
        return jdbcTemplate.queryForObject(
                """
                SELECT
                    (SELECT COUNT(*) FROM crm_contacts WHERE tenant_id = ? AND deleted_at IS NULL) AS total_contacts,
                    (SELECT COUNT(*) FROM crm_leads WHERE tenant_id = ? AND deleted_at IS NULL) AS total_leads,
                    (SELECT COUNT(*) FROM crm_companies WHERE tenant_id = ? AND deleted_at IS NULL) AS total_companies,
                    (
                        SELECT COUNT(*)
                        FROM crm_deals
                        WHERE tenant_id = ?
                          AND deleted_at IS NULL
                          AND UPPER(status) NOT IN ('CLOSED', 'CLOSED_WON', 'CLOSED_LOST', 'WON', 'LOST')
                    ) AS total_open_deals,
                    (
                        SELECT COALESCE(SUM(amount), 0)
                        FROM crm_deals
                        WHERE tenant_id = ?
                          AND deleted_at IS NULL
                          AND UPPER(status) NOT IN ('CLOSED', 'CLOSED_WON', 'CLOSED_LOST', 'WON', 'LOST')
                    ) AS pipeline_value,
                    (
                        SELECT COUNT(*)
                        FROM crm_tasks
                        WHERE tenant_id = ?
                          AND deleted_at IS NULL
                          AND UPPER(status) <> 'DONE'
                    ) AS pending_tasks,
                    (
                        SELECT COUNT(*)
                        FROM crm_tasks
                        WHERE tenant_id = ?
                          AND deleted_at IS NULL
                          AND due_date IS NOT NULL
                          AND due_date < ?
                          AND UPPER(status) <> 'DONE'
                    ) AS overdue_tasks
                """,
                (rs, rowNum) -> new CrmDashboardSnapshot(
                        rs.getLong("total_contacts"),
                        rs.getLong("total_leads"),
                        rs.getLong("total_companies"),
                        rs.getLong("total_open_deals"),
                        rs.getLong("pipeline_value"),
                        rs.getLong("pending_tasks"),
                        rs.getLong("overdue_tasks")
                ),
                tenantId,
                tenantId,
                tenantId,
                tenantId,
                tenantId,
                tenantId,
                tenantId,
                Timestamp.from(referenceTime)
        );
    }

    public long countCompanies(UUID tenantId) {
        return count("SELECT COUNT(*) FROM crm_companies WHERE tenant_id = ? AND deleted_at IS NULL", tenantId);
    }

    public long countContacts(UUID tenantId) {
        return count("SELECT COUNT(*) FROM crm_contacts WHERE tenant_id = ? AND deleted_at IS NULL", tenantId);
    }

    public long countLeads(UUID tenantId) {
        return count("SELECT COUNT(*) FROM crm_leads WHERE tenant_id = ? AND deleted_at IS NULL", tenantId);
    }

    public long countDeals(UUID tenantId) {
        return count(
                """
                SELECT COUNT(*)
                FROM crm_deals
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND UPPER(status) NOT IN ('CLOSED', 'CLOSED_WON', 'CLOSED_LOST', 'WON', 'LOST')
                """,
                tenantId
        );
    }

    public long countPendingTasks(UUID tenantId) {
        return count(
                "SELECT COUNT(*) FROM crm_tasks WHERE tenant_id = ? AND deleted_at IS NULL AND UPPER(status) <> 'DONE'",
                tenantId
        );
    }

    public long countOverdueTasks(UUID tenantId, Instant referenceTime) {
        return count(
                """
                SELECT COUNT(*)
                FROM crm_tasks
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND due_date IS NOT NULL
                  AND due_date < ?
                  AND UPPER(status) <> 'DONE'
                """,
                tenantId,
                Timestamp.from(referenceTime)
        );
    }

    public Map<String, Long> countDealsByStatus(UUID tenantId) {
        return groupByStatus("crm_deals", tenantId);
    }

    public Map<String, Long> countDealsByPipelineStage(UUID tenantId) {
        return jdbcTemplate.query(
                """
                SELECT COALESCE(ps.name, 'Unassigned') AS bucket, COUNT(*) AS total
                FROM crm_deals d
                LEFT JOIN crm_pipeline_stages ps
                  ON ps.id = d.pipeline_stage_id
                 AND ps.tenant_id = d.tenant_id
                 AND ps.deleted_at IS NULL
                WHERE d.tenant_id = ?
                  AND d.deleted_at IS NULL
                GROUP BY COALESCE(ps.name, 'Unassigned')
                ORDER BY MIN(COALESCE(ps.position, 9999)), bucket
                """,
                rs -> {
                    Map<String, Long> result = new LinkedHashMap<>();
                    while (rs.next()) {
                        result.put(rs.getString("bucket"), rs.getLong("total"));
                    }
                    return result;
                },
                tenantId
        );
    }

    public long sumOpenPipelineValue(UUID tenantId) {
        Long value = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(amount), 0)
                FROM crm_deals
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND UPPER(status) NOT IN ('CLOSED', 'CLOSED_WON', 'CLOSED_LOST', 'WON', 'LOST')
                """,
                Long.class,
                tenantId
        );
        return value == null ? 0L : value;
    }

    public Map<String, Long> countLeadsByStatus(UUID tenantId) {
        return groupByStatus("crm_leads", tenantId);
    }

    private long count(String sql, Object... args) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class, args);
        return value == null ? 0L : value;
    }

    private Map<String, Long> groupByStatus(String tableName, UUID tenantId) {
        return jdbcTemplate.query(
                "SELECT UPPER(status) AS status_value, COUNT(*) AS total FROM " + tableName
                        + " WHERE tenant_id = ? AND deleted_at IS NULL GROUP BY UPPER(status) ORDER BY status_value",
                rs -> {
                    Map<String, Long> result = new LinkedHashMap<>();
                    while (rs.next()) {
                        result.put(rs.getString("status_value"), rs.getLong("total"));
                    }
                    return result;
                },
                tenantId
        );
    }

    public record CrmDashboardSnapshot(
            long totalContacts,
            long totalLeads,
            long totalCompanies,
            long totalOpenDeals,
            long pipelineValue,
            long pendingTasks,
            long overdueTasks
    ) {
    }
}

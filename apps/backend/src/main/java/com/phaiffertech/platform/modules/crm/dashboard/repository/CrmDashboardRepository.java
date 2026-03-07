package com.phaiffertech.platform.modules.crm.dashboard.repository;

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
        return count("SELECT COUNT(*) FROM crm_deals WHERE tenant_id = ? AND deleted_at IS NULL", tenantId);
    }

    public long countPendingTasks(UUID tenantId) {
        return count(
                "SELECT COUNT(*) FROM crm_tasks WHERE tenant_id = ? AND deleted_at IS NULL AND UPPER(status) <> 'DONE'",
                tenantId
        );
    }

    public Map<String, Long> countDealsByStatus(UUID tenantId) {
        return groupByStatus("crm_deals", tenantId);
    }

    public Map<String, Long> countLeadsByStatus(UUID tenantId) {
        return groupByStatus("crm_leads", tenantId);
    }

    private long count(String sql, UUID tenantId) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class, tenantId.toString());
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
                tenantId.toString()
        );
    }
}

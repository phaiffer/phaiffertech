package com.phaiffertech.platform.modules.iot.monitoring.repository;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class IotMonitoringRepository {

    private final JdbcTemplate jdbcTemplate;

    public IotMonitoringRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long countOpenAlarms(UUID tenantId) {
        return count(
                """
                SELECT COUNT(*)
                FROM iot_alarms
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND UPPER(status) IN ('OPEN', 'ACKNOWLEDGED')
                """,
                tenantId
        );
    }

    public Map<String, Long> countOpenAlarmsBySeverity(UUID tenantId) {
        return groupBy(
                """
                SELECT UPPER(severity) AS bucket, COUNT(*) AS total
                FROM iot_alarms
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND UPPER(status) IN ('OPEN', 'ACKNOWLEDGED')
                GROUP BY UPPER(severity)
                ORDER BY bucket
                """,
                tenantId
        );
    }

    public Map<String, Long> countAlarmsByStatus(UUID tenantId) {
        return groupBy(
                """
                SELECT UPPER(status) AS bucket, COUNT(*) AS total
                FROM iot_alarms
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                GROUP BY UPPER(status)
                ORDER BY bucket
                """,
                tenantId
        );
    }

    public Map<String, Long> countTelemetryByMetricName(UUID tenantId, Instant from) {
        return groupBy(
                """
                SELECT LOWER(metric_name) AS bucket, COUNT(*) AS total
                FROM iot_telemetry_records
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND recorded_at >= ?
                GROUP BY LOWER(metric_name)
                ORDER BY total DESC, bucket ASC
                """,
                tenantId,
                from
        );
    }

    public Map<String, Long> countMaintenanceByStatus(UUID tenantId) {
        return groupBy(
                """
                SELECT UPPER(status) AS bucket, COUNT(*) AS total
                FROM iot_maintenance
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                GROUP BY UPPER(status)
                ORDER BY bucket
                """,
                tenantId
        );
    }

    private long count(String sql, UUID tenantId) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class, tenantId.toString());
        return value == null ? 0L : value;
    }

    private Map<String, Long> groupBy(String sql, UUID tenantId, Object... additionalArgs) {
        Object[] args = new Object[additionalArgs.length + 1];
        args[0] = tenantId.toString();
        System.arraycopy(additionalArgs, 0, args, 1, additionalArgs.length);

        return jdbcTemplate.query(
                sql,
                rs -> {
                    Map<String, Long> result = new LinkedHashMap<>();
                    while (rs.next()) {
                        result.put(rs.getString("bucket"), rs.getLong("total"));
                    }
                    return result;
                },
                args
        );
    }
}

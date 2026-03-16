package com.phaiffertech.platform.modules.iot.monitoring.repository;

import java.sql.Timestamp;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
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
                Timestamp.from(from)
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

    public List<RecentTelemetryItem> findRecentTelemetry(UUID tenantId, int limit) {
        return jdbcTemplate.query(
                """
                SELECT
                    r.id,
                    d.name AS device_name,
                    r.metric_name,
                    r.metric_value,
                    r.unit,
                    r.recorded_at
                FROM iot_telemetry_records r
                JOIN iot_devices d
                  ON d.id = r.device_id
                 AND d.deleted_at IS NULL
                WHERE r.tenant_id = ?
                  AND r.deleted_at IS NULL
                ORDER BY r.recorded_at DESC
                LIMIT ?
                """,
                rs -> {
                    List<RecentTelemetryItem> items = new ArrayList<>();
                    while (rs.next()) {
                        items.add(new RecentTelemetryItem(
                                rs.getObject("id", UUID.class),
                                rs.getString("device_name"),
                                rs.getString("metric_name"),
                                rs.getBigDecimal("metric_value"),
                                rs.getString("unit"),
                                rs.getTimestamp("recorded_at").toInstant()
                        ));
                    }
                    return items;
                },
                tenantId,
                limit
        );
    }

    private long count(String sql, UUID tenantId) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class, tenantId);
        return value == null ? 0L : value;
    }

    private Map<String, Long> groupBy(String sql, UUID tenantId, Object... additionalArgs) {
        Object[] args = new Object[additionalArgs.length + 1];
        args[0] = tenantId;
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

    public record RecentTelemetryItem(
            UUID id,
            String deviceName,
            String metricName,
            BigDecimal metricValue,
            String unit,
            Instant recordedAt
    ) {
    }
}

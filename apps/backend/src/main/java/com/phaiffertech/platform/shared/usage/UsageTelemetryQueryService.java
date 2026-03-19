package com.phaiffertech.platform.shared.usage;

import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.tenant.service.PlatformAccessService;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.usage.dto.TenantUsageMetricResponse;
import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsageTelemetryQueryService {

    private final JdbcTemplate jdbcTemplate;
    private final PlatformAccessService platformAccessService;
    private final TenantRepository tenantRepository;

    public UsageTelemetryQueryService(
            JdbcTemplate jdbcTemplate,
            PlatformAccessService platformAccessService,
            TenantRepository tenantRepository
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.platformAccessService = platformAccessService;
        this.tenantRepository = tenantRepository;
    }

    @Transactional(readOnly = true)
    public List<TenantUsageMetricResponse> listRecentForTenant(UUID tenantId, int days, int limit) {
        platformAccessService.assertPlatformAdministrationAccess();
        assertTenantExists(tenantId);

        int boundedDays = Math.max(1, Math.min(days, 365));
        int boundedLimit = Math.max(1, Math.min(limit, 100));
        LocalDate fromDate = LocalDate.now(ZoneOffset.UTC).minusDays(boundedDays - 1L);

        return jdbcTemplate.query(
                """
                SELECT metric_key,
                       source,
                       SUM(quantity) AS quantity,
                       unit,
                       MAX(metric_date) AS metric_date,
                       MAX(last_recorded_at) AS last_recorded_at
                FROM tenant_usage_metrics
                WHERE tenant_id = ?
                  AND deleted_at IS NULL
                  AND metric_date >= ?
                GROUP BY metric_key, source, unit
                ORDER BY metric_key ASC, last_recorded_at DESC, source ASC
                LIMIT ?
                """,
                (rs, rowNum) -> new TenantUsageMetricResponse(
                        rs.getString("metric_key"),
                        rs.getString("source"),
                        rs.getLong("quantity"),
                        rs.getString("unit"),
                        rs.getDate("metric_date").toLocalDate(),
                        rs.getTimestamp("last_recorded_at").toInstant()
                ),
                tenantId,
                Date.valueOf(fromDate),
                boundedLimit
        );
    }

    private void assertTenantExists(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found.");
        }
    }
}

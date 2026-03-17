package com.phaiffertech.platform.shared.usage;

import com.phaiffertech.platform.core.module.service.ModuleAccessService;
import com.phaiffertech.platform.shared.metrics.PlatformMetricsService;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class UsageTelemetryService {

    private static final Logger log = LoggerFactory.getLogger(UsageTelemetryService.class);

    private static final String UPSERT_USAGE_SQL = """
            INSERT INTO tenant_usage_metrics (
                id,
                tenant_id,
                metric_key,
                source,
                metric_date,
                quantity,
                unit,
                last_recorded_at,
                created_by,
                updated_by
            )
            VALUES (?, ?, ?, ?, ?, 1, 'COUNT', CURRENT_TIMESTAMP, ?, ?)
            ON CONFLICT (tenant_id, metric_key, source, metric_date)
            DO UPDATE SET quantity = tenant_usage_metrics.quantity + 1,
                          last_recorded_at = CURRENT_TIMESTAMP,
                          updated_at = CURRENT_TIMESTAMP,
                          updated_by = EXCLUDED.updated_by,
                          deleted_at = NULL
            """;

    private final JdbcTemplate jdbcTemplate;
    private final ModuleAccessService moduleAccessService;
    private final PlatformMetricsService platformMetricsService;

    public UsageTelemetryService(
            JdbcTemplate jdbcTemplate,
            ModuleAccessService moduleAccessService,
            PlatformMetricsService platformMetricsService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.moduleAccessService = moduleAccessService;
        this.platformMetricsService = platformMetricsService;
    }

    public void recordApiRequest(UUID tenantId, String requestPath, int status) {
        if (tenantId == null || requestPath == null || !requestPath.startsWith("/api/v1/") || requestPath.startsWith("/api/v1/health")) {
            return;
        }
        if (status < 200 || status >= 400) {
            return;
        }

        String moduleCode = moduleAccessService.resolveModuleCode(requestPath).orElse("CORE_PLATFORM");
        recordUsageSafely(tenantId, "api.request", moduleCode);
        platformMetricsService.recordApiRequest(moduleCode, status);

        moduleAccessService.resolveModuleCode(requestPath)
                .ifPresent(module -> recordUsageSafely(tenantId, "module.request", module));
    }

    public void recordLoginSuccess(UUID tenantId) {
        recordUsageSafely(tenantId, "auth.login.success", "AUTH");
    }

    public void recordEntityCreated(UUID tenantId, String entity) {
        recordUsageSafely(tenantId, "entity.create", entity);
    }

    private void recordUsageSafely(UUID tenantId, String metricKey, String source) {
        try {
            recordUsage(tenantId, metricKey, source);
        } catch (RuntimeException ex) {
            log.warn("usage.telemetry.write.failed tenantId={} metricKey={} source={}", tenantId, metricKey, source, ex);
        }
    }

    private void recordUsage(UUID tenantId, String metricKey, String source) {
        if (tenantId == null) {
            return;
        }

        String normalizedMetricKey = normalize(metricKey);
        String normalizedSource = normalize(source);
        if (normalizedMetricKey == null || normalizedSource == null) {
            return;
        }

        platformMetricsService.recordUsageEvent(normalizedMetricKey, normalizedSource);
        jdbcTemplate.update(
                UPSERT_USAGE_SQL,
                UUID.randomUUID(),
                tenantId,
                normalizedMetricKey,
                normalizedSource,
                Date.valueOf(LocalDate.now(ZoneOffset.UTC)),
                resolveActor(),
                resolveActor()
        );
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.userId().toString();
        }
        return "system";
    }
}

package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SaasOperationalFoundationsIntegrationTest extends AbstractIntegrationTest {

    @Test
    void platformAdminShouldManageTenantFeatureFlagsWithoutCrossTenantLeakage() {
        AuthSession tenantA = createTenantAdminSession(
                "tenant-feature-a",
                "tenant-feature-a@example.test",
                "CORE_PLATFORM",
                "IOT"
        );
        AuthSession tenantB = createTenantAdminSession(
                "tenant-feature-b",
                "tenant-feature-b@example.test",
                "CORE_PLATFORM",
                "IOT"
        );
        AuthSession platformAdmin = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> updateResponse = put(
                "/feature-flags/tenants/" + tenantA.tenantId() + "/iot.enabled",
                Map.of("enabled", false),
                platformAdmin
        );

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertEquals("iot.enabled", updated.path("key").asText());
        assertFalse(updated.path("enabled").asBoolean());
        assertEquals("TENANT", updated.path("scope").asText());

        JsonNode tenantAModule = findModule(requireBody(get("/modules", tenantA)).path("data"), "IOT");
        JsonNode tenantBModule = findModule(requireBody(get("/modules", tenantB)).path("data"), "IOT");

        assertFalse(tenantAModule.path("featureFlagEnabled").asBoolean());
        assertFalse(tenantAModule.path("available").asBoolean());
        assertTrue(tenantBModule.path("featureFlagEnabled").asBoolean());
        assertTrue(tenantBModule.path("available").asBoolean());

        assertTrue(countRows(
                """
                SELECT COUNT(*)
                FROM audit_logs
                WHERE tenant_id = ?
                  AND entity_name = 'feature_flag'
                  AND entity_id = 'iot.enabled'
                  AND ip_address IS NOT NULL
                  AND payload::jsonb -> 'auditContext' ->> 'path' = ?
                """,
                tenantA.tenantId(),
                "/api/v1/feature-flags/tenants/" + tenantA.tenantId() + "/iot.enabled"
        ) > 0);
    }

    @Test
    void shouldPersistTenantUsageTelemetryForLoginsRequestsAndEntityCreation() {
        AuthSession session = createTenantAdminSession(
                "tenant-usage",
                "tenant-usage@example.test",
                "CORE_PLATFORM",
                "PET"
        );

        ResponseEntity<JsonNode> listResponse = get("/pet/clients?page=0&size=20", session);
        assertEquals(200, listResponse.getStatusCode().value());

        ResponseEntity<JsonNode> createResponse = post("/pet/clients", Map.of(
                "name", "Usage Telemetry Client",
                "status", "ACTIVE"
        ), session);
        assertEquals(200, createResponse.getStatusCode().value());

        assertTrue(countRows(
                """
                SELECT COUNT(*)
                FROM tenant_usage_metrics
                WHERE tenant_id = ?
                  AND metric_key = 'auth.login.success'
                  AND source = 'auth'
                  AND quantity >= 1
                """,
                session.tenantId()
        ) > 0);

        assertTrue(countRows(
                """
                SELECT COUNT(*)
                FROM tenant_usage_metrics
                WHERE tenant_id = ?
                  AND metric_key = 'api.request'
                  AND source = 'pet'
                  AND quantity >= 2
                """,
                session.tenantId()
        ) > 0);

        assertTrue(countRows(
                """
                SELECT COUNT(*)
                FROM tenant_usage_metrics
                WHERE tenant_id = ?
                  AND metric_key = 'module.request'
                  AND source = 'pet'
                  AND quantity >= 2
                """,
                session.tenantId()
        ) > 0);

        assertTrue(countRows(
                """
                SELECT COUNT(*)
                FROM tenant_usage_metrics
                WHERE tenant_id = ?
                  AND metric_key = 'entity.create'
                  AND source = 'pet_client'
                  AND quantity >= 1
                """,
                session.tenantId()
        ) > 0);
    }

    @Test
    void platformAdminShouldReadRecentTenantUsageMetrics() {
        AuthSession tenantSession = createTenantAdminSession(
                "tenant-usage-read",
                "tenant-usage-read@example.test",
                "CORE_PLATFORM",
                "PET"
        );
        AuthSession platformAdmin = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> listResponse = get("/pet/clients?page=0&size=20", tenantSession);
        assertEquals(200, listResponse.getStatusCode().value());

        ResponseEntity<JsonNode> createResponse = post("/pet/clients", Map.of(
                "name", "Usage Visibility Client",
                "status", "ACTIVE"
        ), tenantSession);
        assertEquals(200, createResponse.getStatusCode().value());

        ResponseEntity<JsonNode> metricsResponse = get(
                "/tenants/" + tenantSession.tenantId() + "/usage-metrics?days=30&limit=10",
                platformAdmin
        );

        assertEquals(200, metricsResponse.getStatusCode().value());
        JsonNode metrics = requireBody(metricsResponse).path("data");
        assertTrue(metrics.isArray());
        assertTrue(metrics.size() >= 1);
        assertTrue(containsMetric(metrics, "api.request", "pet"));
        assertTrue(containsMetric(metrics, "entity.create", "pet_client"));
    }

    private JsonNode findModule(JsonNode modules, String code) {
        for (JsonNode module : modules) {
            if (code.equals(module.path("code").asText())) {
                return module;
            }
        }
        throw new AssertionError("Module not found: " + code);
    }

    private boolean containsMetric(JsonNode metrics, String metricKey, String source) {
        for (JsonNode metric : metrics) {
            if (metricKey.equals(metric.path("metricKey").asText())
                    && source.equals(metric.path("source").asText())) {
                return true;
            }
        }
        return false;
    }
}

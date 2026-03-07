package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IotDashboardReportsIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldReturnConsistentDashboardAndReportSummaries() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String deviceOnlineId = createDevice(session, "Online-" + marker, "D-ON-" + marker);
        String deviceOfflineId = createDevice(session, "Offline-" + marker, "D-OFF-" + marker);

        ResponseEntity<JsonNode> createRegister = post("/iot/registers", Map.of(
                "deviceId", deviceOnlineId,
                "name", "Temperature-" + marker,
                "code", "TMP-" + marker,
                "metricName", "temperature",
                "unit", "c",
                "dataType", "DECIMAL",
                "minThreshold", 10.0,
                "maxThreshold", 80.0,
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createRegister.getStatusCode().value());
        String registerId = requireBody(createRegister).path("data").path("id").asText();

        ResponseEntity<JsonNode> firstTelemetry = post("/iot/telemetry", Map.of(
                "deviceId", deviceOnlineId,
                "registerId", registerId,
                "metricName", "temperature",
                "metricValue", 75.0,
                "recordedAt", Instant.now().minusSeconds(120).toString()
        ), session);
        assertEquals(200, firstTelemetry.getStatusCode().value());

        ResponseEntity<JsonNode> secondTelemetry = post("/iot/telemetry", Map.of(
                "deviceId", deviceOnlineId,
                "registerId", registerId,
                "metricName", "temperature",
                "metricValue", 92.0,
                "recordedAt", Instant.now().toString()
        ), session);
        assertEquals(200, secondTelemetry.getStatusCode().value());

        ResponseEntity<JsonNode> maintenance = post("/iot/maintenance", Map.of(
                "deviceId", deviceOfflineId,
                "title", "Maintenance-" + marker,
                "status", "PENDING",
                "priority", "HIGH"
        ), session);
        assertEquals(200, maintenance.getStatusCode().value());

        ResponseEntity<JsonNode> dashboard = get("/iot/dashboard/summary", session);
        assertEquals(200, dashboard.getStatusCode().value());
        JsonNode dashboardData = requireBody(dashboard).path("data");
        assertEquals(2, dashboardData.path("totalDevices").asInt());
        assertEquals(1, dashboardData.path("activeDevices").asInt());
        assertEquals(1, dashboardData.path("offlineDevices").asInt());
        assertTrue(dashboardData.path("totalAlarmsOpen").asInt() >= 1);
        assertTrue(dashboardData.path("telemetryPointsLast24h").asInt() >= 2);
        assertEquals(1, dashboardData.path("pendingMaintenance").asInt());
        assertTrue(dashboardData.path("devicesLastSeenSummary").path("last_5m").asInt() >= 1);
        assertTrue(dashboardData.path("devicesLastSeenSummary").path("never_seen").asInt() >= 1);
        assertTrue(dashboardData.path("summaryCards").size() >= 6);
        assertTrue(dashboardData.path("sections").size() >= 2);
        assertTrue(dashboardData.path("sections").get(0).path("items").size() >= 1);

        ResponseEntity<JsonNode> reports = get("/iot/reports/summary", session);
        assertEquals(200, reports.getStatusCode().value());
        JsonNode reportData = requireBody(reports).path("data");
        assertEquals(2, reportData.path("totalDevices").asInt());
        assertEquals(1, reportData.path("totalRegisters").asInt());
        assertTrue(reportData.path("telemetryPointsLast24h").asInt() >= 2);
        assertTrue(reportData.path("openAlarms").asInt() >= 1);
        assertEquals(1, reportData.path("pendingMaintenance").asInt());
        assertTrue(reportData.path("devicesByStatus").path("ALERT").asInt() >= 1);
        assertTrue(reportData.path("devicesByStatus").path("OFFLINE").asInt() >= 1);
        assertTrue(reportData.path("telemetryByMetric").path("temperature").asInt() >= 2);
        assertTrue(reportData.path("maintenanceByStatus").path("PENDING").asInt() >= 1);
    }

    private String createDevice(AuthSession session, String name, String identifier) {
        ResponseEntity<JsonNode> response = post("/iot/devices", Map.of(
                "name", name,
                "identifier", identifier,
                "status", "ONLINE"
        ), session);

        assertEquals(200, response.getStatusCode().value());
        return requireBody(response).path("data").path("id").asText();
    }
}

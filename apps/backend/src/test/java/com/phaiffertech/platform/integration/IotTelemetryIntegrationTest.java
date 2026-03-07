package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IotTelemetryIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldIngestAndListTelemetryAndTriggerAlarmEvaluation() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createDevice = post("/iot/devices", Map.of(
                "name", "Telemetry-Device-" + marker,
                "identifier", "TLM-" + marker,
                "status", "ONLINE"
        ), session);

        assertEquals(200, createDevice.getStatusCode().value());
        String deviceId = requireBody(createDevice).path("data").path("id").asText();

        ResponseEntity<JsonNode> ingestResponse = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "metricName", "temperature",
                "metricValue", 95.3,
                "unit", "c",
                "metadata", Map.of("source", "integration-test")
        ), session);

        assertEquals(200, ingestResponse.getStatusCode().value());
        JsonNode telemetry = requireBody(ingestResponse).path("data");
        assertEquals(deviceId, telemetry.path("deviceId").asText());
        assertEquals("temperature", telemetry.path("metricName").asText());

        String recordedAt = telemetry.path("recordedAt").asText();
        Instant from = Instant.parse(recordedAt).minusSeconds(60);
        Instant to = Instant.parse(recordedAt).plusSeconds(60);

        ResponseEntity<JsonNode> listResponse = get(
                "/iot/telemetry?page=0&size=20&search=temperature&deviceId=" + deviceId
                        + "&recordedFrom=" + from
                        + "&recordedTo=" + to,
                session
        );

        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        int alarmCount = countRows(
                "SELECT COUNT(*) FROM iot_alarms WHERE tenant_id = ? AND device_id = ?",
                session.tenantId(),
                deviceId
        );
        assertTrue(alarmCount >= 1);
    }

    @Test
    void shouldBlockTelemetryAccessWhenTenantHeaderDoesNotMatchAuthenticatedTenant() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> response = get(
                "/iot/telemetry?page=0&size=20",
                session,
                UUID.randomUUID().toString()
        );

        assertEquals(403, response.getStatusCode().value());
    }
}

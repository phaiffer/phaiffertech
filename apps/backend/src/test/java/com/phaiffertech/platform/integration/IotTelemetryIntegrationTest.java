package com.phaiffertech.platform.integration;

import com.phaiffertech.platform.support.AbstractIntegrationTest;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
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
                "serialNumber", "TLM-" + marker,
                "status", "ONLINE"
        ), session);

        assertEquals(200, createDevice.getStatusCode().value());
        String deviceId = requireBody(createDevice).path("data").path("id").asText();

        ResponseEntity<JsonNode> ingestResponse = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "metric", "temperature",
                "value", 95.3
        ), session);

        assertEquals(200, ingestResponse.getStatusCode().value());
        JsonNode telemetry = requireBody(ingestResponse).path("data");
        assertEquals(deviceId, telemetry.path("deviceId").asText());
        assertEquals("temperature", telemetry.path("metric").asText());

        ResponseEntity<JsonNode> listResponse = get(
                "/iot/telemetry?page=0&size=20&search=temperature",
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
}

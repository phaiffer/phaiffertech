package com.phaiffertech.platform.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

class IotTelemetryCurrentFlowIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldIngestAndListTelemetryUsingCurrentTenantAwareFlow() {
        String marker = randomSearchMarker();
        AuthSession session = createTenantSessionWithPermissions(
                "telemetry-current-" + marker,
                "telemetry-current-" + marker + "@local.test",
                List.of("iot.device.create", "iot.telemetry.write", "iot.telemetry.read"),
                "CORE_PLATFORM",
                "IOT"
        );

        ResponseEntity<JsonNode> createDevice = post("/iot/devices", Map.of(
                "name", "Telemetry Device " + marker,
                "identifier", "TEL-" + marker,
                "status", "ONLINE"
        ), session);

        assertEquals(200, createDevice.getStatusCode().value());
        String deviceId = requireBody(createDevice).path("data").path("id").asText();

        ResponseEntity<JsonNode> temperatureIngest = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "metricName", "temperature",
                "metricValue", 21.7,
                "unit", "c",
                "metadata", Map.of("source", "current-flow")
        ), session);

        ResponseEntity<JsonNode> pressureIngest = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "metricName", "pressure",
                "metricValue", 1.8,
                "unit", "bar",
                "metadata", Map.of("source", "current-flow")
        ), session);

        assertEquals(200, temperatureIngest.getStatusCode().value());
        assertEquals(200, pressureIngest.getStatusCode().value());
        assertEquals(deviceId, requireBody(temperatureIngest).path("data").path("deviceId").asText());
        assertEquals("temperature", requireBody(temperatureIngest).path("data").path("metricName").asText());
        assertEquals("current-flow", requireBody(temperatureIngest).path("data").path("metadata").path("source").asText());
        assertNotNull(requireBody(temperatureIngest).path("data").path("recordedAt").asText());

        ResponseEntity<JsonNode> listResponse = get(
                "/iot/telemetry?page=0&size=1&search=temp&deviceId=" + deviceId,
                session
        );

        assertEquals(200, listResponse.getStatusCode().value());
        JsonNode payload = requireBody(listResponse).path("data");
        assertEquals(1, payload.path("items").size());
        assertEquals(1, payload.path("totalItems").asInt());
        assertEquals(1, payload.path("totalPages").asInt());
        assertEquals("temperature", payload.path("items").get(0).path("metricName").asText());
        assertEquals(deviceId, payload.path("items").get(0).path("deviceId").asText());
        assertEquals("current-flow", payload.path("items").get(0).path("metadata").path("source").asText());
    }
}

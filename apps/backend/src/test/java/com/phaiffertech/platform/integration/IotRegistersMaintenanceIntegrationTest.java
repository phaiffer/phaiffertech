package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IotRegistersMaintenanceIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteRegister() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String deviceId = createDevice(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/iot/registers", Map.of(
                "deviceId", deviceId,
                "name", "Pressure-" + marker,
                "code", "PRS-" + marker,
                "metricName", "pressure",
                "unit", "bar",
                "dataType", "DECIMAL",
                "minThreshold", 1.2,
                "maxThreshold", 3.8,
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String registerId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get(
                "/iot/registers?page=0&size=20&deviceId=" + deviceId + "&metricName=pressure",
                session
        );
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/iot/registers/" + registerId, Map.of(
                "deviceId", deviceId,
                "name", "Pressure Updated-" + marker,
                "code", "PRS-" + marker,
                "metricName", "pressure",
                "unit", "bar",
                "dataType", "DECIMAL",
                "minThreshold", 1.0,
                "maxThreshold", 4.0,
                "status", "INACTIVE"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("INACTIVE", requireBody(updateResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/iot/registers/" + registerId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/iot/registers?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    @Test
    void shouldCreateListUpdateAndDeleteMaintenance() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String deviceId = createDevice(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/iot/maintenance", Map.of(
                "deviceId", deviceId,
                "title", "Inspection-" + marker,
                "description", "Quarterly inspection",
                "status", "PENDING",
                "priority", "HIGH",
                "scheduledAt", Instant.now().plusSeconds(3600).toString()
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String maintenanceId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get(
                "/iot/maintenance?page=0&size=20&deviceId=" + deviceId + "&status=PENDING",
                session
        );
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/iot/maintenance/" + maintenanceId, Map.of(
                "deviceId", deviceId,
                "title", "Inspection Complete-" + marker,
                "description", "Completed visit",
                "status", "COMPLETED",
                "priority", "MEDIUM",
                "scheduledAt", Instant.now().minusSeconds(3600).toString(),
                "completedAt", Instant.now().toString()
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("COMPLETED", requireBody(updateResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/iot/maintenance/" + maintenanceId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/iot/maintenance?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    private String createDevice(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/iot/devices", Map.of(
                "name", "Control-" + marker,
                "identifier", "CTRL-" + marker,
                "status", "ONLINE"
        ), session);

        assertEquals(200, response.getStatusCode().value());
        return requireBody(response).path("data").path("id").asText();
    }
}

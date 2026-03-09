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
                "functionCode", "FC03",
                "registerAddress", 40001,
                "metricName", "pressure",
                "unit", "bar",
                "dataType", "DECIMAL",
                "minThreshold", 1.2,
                "maxThreshold", 3.8,
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("FC03:40001", requireBody(createResponse).path("data").path("code").asText());
        assertEquals("FC03", requireBody(createResponse).path("data").path("functionCode").asText());
        assertEquals(40001, requireBody(createResponse).path("data").path("registerAddress").asInt());
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
                "functionCode", "FC04",
                "registerAddress", 30011,
                "metricName", "pressure",
                "unit", "bar",
                "dataType", "DECIMAL",
                "minThreshold", 1.0,
                "maxThreshold", 4.0,
                "status", "INACTIVE"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("INACTIVE", requireBody(updateResponse).path("data").path("status").asText());
        assertEquals("FC04:30011", requireBody(updateResponse).path("data").path("code").asText());
        assertEquals("FC04", requireBody(updateResponse).path("data").path("functionCode").asText());
        assertEquals(30011, requireBody(updateResponse).path("data").path("registerAddress").asInt());

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
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "assignedUserLabel", "Field Team " + marker
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String maintenanceId = requireBody(createResponse).path("data").path("id").asText();
        assertEquals("Field Team " + marker, requireBody(createResponse).path("data").path("assignedUserLabel").asText());

        ResponseEntity<JsonNode> listResponse = get(
                "/iot/maintenance?page=0&size=20&deviceId=" + deviceId + "&status=PENDING&search=" + marker,
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
                "completedAt", Instant.now().toString(),
                "assignedUserLabel", "Planner " + marker
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("COMPLETED", requireBody(updateResponse).path("data").path("status").asText());
        assertEquals("Planner " + marker, requireBody(updateResponse).path("data").path("assignedUserLabel").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/iot/maintenance/" + maintenanceId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/iot/maintenance?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    @Test
    void shouldDeriveRegisterMappingFromLegacyCode() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String deviceId = createDevice(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/iot/registers", Map.of(
                "deviceId", deviceId,
                "name", "Legacy Register-" + marker,
                "code", "FC04:30021",
                "metricName", "temperature",
                "unit", "c",
                "dataType", "FLOAT32",
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("FC04", requireBody(createResponse).path("data").path("functionCode").asText());
        assertEquals(30021, requireBody(createResponse).path("data").path("registerAddress").asInt());
    }

    @Test
    void shouldLinkMaintenanceToOperationalAlarmContext() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String deviceId = createDevice(session, marker);
        String registerId = createRegister(session, deviceId, marker);

        ResponseEntity<JsonNode> telemetryResponse = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "registerId", registerId,
                "metricName", "pressure",
                "metricValue", 4.4,
                "unit", "bar"
        ), session);
        assertEquals(200, telemetryResponse.getStatusCode().value());

        ResponseEntity<JsonNode> alarmListResponse = get(
                "/iot/alarms?page=0&size=20&deviceId=" + deviceId + "&status=OPEN",
                session
        );
        assertEquals(200, alarmListResponse.getStatusCode().value());
        JsonNode alarm = requireBody(alarmListResponse).path("data").path("items").get(0);
        String alarmId = alarm.path("id").asText();
        String alarmCode = alarm.path("code").asText();
        String alarmMessage = alarm.path("message").asText();

        ResponseEntity<JsonNode> createMaintenance = post("/iot/maintenance", Map.of(
                "deviceId", deviceId,
                "linkedAlarmId", alarmId,
                "title", "Investigate pressure event-" + marker,
                "status", "PENDING",
                "priority", "CRITICAL",
                "assignedUserLabel", "Field Crew " + marker
        ), session);

        assertEquals(200, createMaintenance.getStatusCode().value());
        JsonNode maintenance = requireBody(createMaintenance).path("data");
        assertEquals(alarmId, maintenance.path("linkedAlarmId").asText());
        assertEquals(registerId, maintenance.path("linkedRegisterId").asText());
        assertEquals(alarmCode, maintenance.path("linkedAlarmCode").asText());
        assertEquals("ALARM", maintenance.path("origin").asText());
        assertEquals(alarmMessage, maintenance.path("trigger").asText());
        assertEquals("Field Crew " + marker, maintenance.path("assignedUserLabel").asText());

        ResponseEntity<JsonNode> searchResponse = get(
                "/iot/maintenance?page=0&size=20&search=" + marker,
                session
        );
        assertEquals(200, searchResponse.getStatusCode().value());
        assertTrue(requireBody(searchResponse).path("data").path("items").size() >= 1);
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

    private String createRegister(AuthSession session, String deviceId, String marker) {
        ResponseEntity<JsonNode> response = post("/iot/registers", Map.of(
                "deviceId", deviceId,
                "name", "Pressure-" + marker,
                "functionCode", "FC03",
                "registerAddress", 40011,
                "metricName", "pressure",
                "unit", "bar",
                "dataType", "DECIMAL",
                "minThreshold", 1.2,
                "maxThreshold", 3.8,
                "status", "ACTIVE"
        ), session);

        assertEquals(200, response.getStatusCode().value());
        return requireBody(response).path("data").path("id").asText();
    }
}

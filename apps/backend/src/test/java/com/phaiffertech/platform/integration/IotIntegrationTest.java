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

class IotIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteDevice() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/iot/devices", Map.of(
                "name", "Device-" + marker,
                "identifier", "ID-" + marker,
                "type", "SENSOR",
                "location", "Room A",
                "description", "Primary temperature sensor",
                "status", "ONLINE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String deviceId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get("/iot/devices?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/iot/devices/" + deviceId, Map.of(
                "name", "Updated Device-" + marker,
                "identifier", "ID-" + marker,
                "type", "SENSOR",
                "location", "Room B",
                "description", "Updated description",
                "status", "OFFLINE"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("OFFLINE", requireBody(updateResponse).path("data").path("status").asText());
        assertEquals("Updated description", requireBody(updateResponse).path("data").path("description").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/iot/devices/" + deviceId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/iot/devices?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    @Test
    void shouldCreateUpdateAndAcknowledgeAlarm() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createDevice = post("/iot/devices", Map.of(
                "name", "Alarm-Device-" + marker,
                "identifier", "ALM-" + marker,
                "status", "ONLINE"
        ), session);

        assertEquals(200, createDevice.getStatusCode().value());
        String deviceId = requireBody(createDevice).path("data").path("id").asText();

        ResponseEntity<JsonNode> createAlarm = post("/iot/alarms", Map.of(
                "deviceId", deviceId,
                "code", "TEMP_HIGH",
                "message", "Temperature exceeded",
                "severity", "HIGH",
                "status", "OPEN",
                "triggeredAt", Instant.now().toString()
        ), session);

        assertEquals(200, createAlarm.getStatusCode().value());
        String alarmId = requireBody(createAlarm).path("data").path("id").asText();

        ResponseEntity<JsonNode> updateAlarm = put("/iot/alarms/" + alarmId, Map.of(
                "deviceId", deviceId,
                "code", "TEMP_HIGH",
                "message", "Temperature still high",
                "severity", "CRITICAL",
                "status", "OPEN",
                "triggeredAt", Instant.now().toString()
        ), session);

        assertEquals(200, updateAlarm.getStatusCode().value());
        assertEquals("CRITICAL", requireBody(updateAlarm).path("data").path("severity").asText());

        ResponseEntity<JsonNode> acknowledgeResponse = post("/iot/alarms/" + alarmId + "/acknowledge", Map.of(), session);
        assertEquals(200, acknowledgeResponse.getStatusCode().value());
        assertEquals("ACKNOWLEDGED", requireBody(acknowledgeResponse).path("data").path("status").asText());
        assertEquals(session.userId(), requireBody(acknowledgeResponse).path("data").path("acknowledgedBy").asText());

        ResponseEntity<JsonNode> listResponse = get(
                "/iot/alarms?page=0&size=20&status=ACKNOWLEDGED&deviceId=" + deviceId,
                session
        );
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);
    }

    @Test
    void shouldKeepDeviceIsolationAcrossTenants() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String otherTenantId = UUID.randomUUID().toString();

        executeSql(
                "INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, 'ACTIVE')",
                otherTenantId,
                "Other Tenant " + marker,
                "other-" + marker
        );
        executeSql(
                """
                INSERT INTO iot_devices (id, tenant_id, name, serial_number, identifier, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                UUID.randomUUID().toString(),
                otherTenantId,
                "Other Device-" + marker,
                "ISO-" + marker,
                "ISO-" + marker,
                "ONLINE"
        );

        ResponseEntity<JsonNode> secondTenantList = get("/iot/devices?page=0&size=20&search=" + marker, session);

        assertEquals(200, secondTenantList.getStatusCode().value());
        assertEquals(0, requireBody(secondTenantList).path("data").path("items").size());
    }

    @Test
    void shouldBlockIotRequestsWhenTenantHeaderDoesNotMatchAuthenticatedTenant() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> response = get(
                "/iot/devices?page=0&size=20",
                session,
                UUID.randomUUID().toString()
        );

        assertEquals(403, response.getStatusCode().value());
    }
}

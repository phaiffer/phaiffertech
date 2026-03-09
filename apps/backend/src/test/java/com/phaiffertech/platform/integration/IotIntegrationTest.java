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

        ResponseEntity<JsonNode> createResponse = post("/iot/devices", Map.ofEntries(
                Map.entry("name", "Device-" + marker),
                Map.entry("identifier", "ID-" + marker),
                Map.entry("type", "SENSOR"),
                Map.entry("location", "Room A"),
                Map.entry("description", "Primary temperature sensor"),
                Map.entry("status", "ONLINE"),
                Map.entry("transport", "MODBUS_TCP"),
                Map.entry("host", "192.168.10.21"),
                Map.entry("port", 502),
                Map.entry("unitId", 1),
                Map.entry("pollingProfile", "5s")
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("MODBUS_TCP", requireBody(createResponse).path("data").path("transport").asText());
        assertEquals("192.168.10.21", requireBody(createResponse).path("data").path("host").asText());
        assertEquals(502, requireBody(createResponse).path("data").path("port").asInt());
        assertEquals(1, requireBody(createResponse).path("data").path("unitId").asInt());
        String deviceId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get("/iot/devices?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/iot/devices/" + deviceId, Map.ofEntries(
                Map.entry("name", "Updated Device-" + marker),
                Map.entry("identifier", "ID-" + marker),
                Map.entry("type", "SENSOR"),
                Map.entry("location", "Room B"),
                Map.entry("description", "Updated description"),
                Map.entry("status", "OFFLINE"),
                Map.entry("transport", "MODBUS_RTU"),
                Map.entry("host", "10.0.4.50"),
                Map.entry("port", 502),
                Map.entry("unitId", 7),
                Map.entry("pollingProfile", "10s"),
                Map.entry("gateway", "10.0.4.50")
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("OFFLINE", requireBody(updateResponse).path("data").path("status").asText());
        assertEquals("Updated description", requireBody(updateResponse).path("data").path("description").asText());
        assertEquals("MODBUS_RTU", requireBody(updateResponse).path("data").path("transport").asText());
        assertEquals("10.0.4.50", requireBody(updateResponse).path("data").path("gateway").asText());

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

    @Test
    void shouldDeriveDeviceModbusFieldsFromLegacyDescription() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/iot/devices", Map.of(
                "name", "Legacy-" + marker,
                "identifier", "LEG-" + marker,
                "description", "Payload legado | Modbus TCP 192.168.0.15:502 • Unit 4 | Variáveis: temperature",
                "status", "ONLINE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("MODBUS_TCP", requireBody(createResponse).path("data").path("transport").asText());
        assertEquals("192.168.0.15", requireBody(createResponse).path("data").path("host").asText());
        assertEquals(502, requireBody(createResponse).path("data").path("port").asInt());
        assertEquals(4, requireBody(createResponse).path("data").path("unitId").asInt());
    }
}

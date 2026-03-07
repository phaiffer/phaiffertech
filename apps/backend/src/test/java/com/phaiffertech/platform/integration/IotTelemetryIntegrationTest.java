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

        ResponseEntity<JsonNode> createRegister = post("/iot/registers", Map.of(
                "deviceId", deviceId,
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

        ResponseEntity<JsonNode> ingestResponse = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "registerId", registerId,
                "metricName", "temperature",
                "metricValue", 95.3,
                "unit", "c",
                "metadata", Map.of("source", "integration-test")
        ), session);

        assertEquals(200, ingestResponse.getStatusCode().value());
        JsonNode telemetry = requireBody(ingestResponse).path("data");
        assertEquals(deviceId, telemetry.path("deviceId").asText());
        assertEquals(registerId, telemetry.path("registerId").asText());
        assertEquals("temperature", telemetry.path("metricName").asText());

        String recordedAt = telemetry.path("recordedAt").asText();
        Instant from = Instant.parse(recordedAt).minusSeconds(60);
        Instant to = Instant.parse(recordedAt).plusSeconds(60);

        ResponseEntity<JsonNode> listResponse = get(
                "/iot/telemetry?page=0&size=20&search=temperature&deviceId=" + deviceId
                        + "&registerId=" + registerId
                        + "&metricName=temperature"
                        + "&startAt=" + from
                        + "&endAt=" + to,
                session
        );

        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        int alarmCount = countRows(
                "SELECT COUNT(*) FROM iot_alarms WHERE tenant_id = ? AND device_id = ? AND register_id = ?",
                session.tenantId(),
                deviceId,
                registerId
        );
        assertTrue(alarmCount >= 1);

        ResponseEntity<JsonNode> deviceResponse = get("/iot/devices/" + deviceId, session);
        assertEquals(200, deviceResponse.getStatusCode().value());
        assertTrue(requireBody(deviceResponse).path("data").path("lastSeenAt").asText().length() > 10);
        assertEquals("ALERT", requireBody(deviceResponse).path("data").path("status").asText());
    }

    @Test
    void shouldKeepTelemetryIsolatedAcrossTenants() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String otherTenantId = UUID.randomUUID().toString();
        String deviceId = UUID.randomUUID().toString();
        String recordId = UUID.randomUUID().toString();

        executeSql(
                "INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, 'ACTIVE')",
                otherTenantId,
                "Telemetry Other " + marker,
                "telemetry-other-" + marker
        );
        executeSql(
                """
                INSERT INTO iot_devices (id, tenant_id, name, serial_number, identifier, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                deviceId,
                otherTenantId,
                "Other Telemetry Device-" + marker,
                "TLM-" + marker,
                "TLM-" + marker,
                "ONLINE"
        );
        executeSql(
                """
                INSERT INTO iot_telemetry_records (id, tenant_id, device_id, metric_name, metric_value, recorded_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                recordId,
                otherTenantId,
                deviceId,
                "isolated_" + marker,
                18.5,
                Instant.now()
        );

        ResponseEntity<JsonNode> isolatedList = get("/iot/telemetry?page=0&size=20&search=" + marker, session);

        assertEquals(200, isolatedList.getStatusCode().value());
        assertEquals(0, requireBody(isolatedList).path("data").path("items").size());
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

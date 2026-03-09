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
    void shouldIngestTelemetryUsingExplicitModbusMappingAndEnrichMetadata() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createDevice = post("/iot/devices", Map.ofEntries(
                Map.entry("name", "Telemetry-Device-" + marker),
                Map.entry("identifier", "TLM-" + marker),
                Map.entry("status", "ONLINE"),
                Map.entry("transport", "MODBUS_TCP"),
                Map.entry("host", "192.168.10.30"),
                Map.entry("port", 502),
                Map.entry("unitId", 3),
                Map.entry("pollingProfile", "5s")
        ), session);

        assertEquals(200, createDevice.getStatusCode().value());
        String deviceId = requireBody(createDevice).path("data").path("id").asText();

        ResponseEntity<JsonNode> createRegister = post("/iot/registers", Map.of(
                "deviceId", deviceId,
                "name", "Temperature-" + marker,
                "functionCode", "FC03",
                "registerAddress", 40001,
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
                "metricName", "temperature",
                "metricValue", 72.3,
                "unit", "c",
                "metadata", Map.of(
                        "source", "integration-test",
                        "functionCode", "FC03",
                        "registerAddress", 40001
                )
        ), session);

        assertEquals(200, ingestResponse.getStatusCode().value());
        JsonNode telemetry = requireBody(ingestResponse).path("data");
        assertEquals(deviceId, telemetry.path("deviceId").asText());
        assertEquals(registerId, telemetry.path("registerId").asText());
        assertEquals("temperature", telemetry.path("metricName").asText());
        assertEquals("GOOD", telemetry.path("metadata").path("quality").asText());
        assertEquals("FC03", telemetry.path("metadata").path("functionCode").asText());
        assertEquals(40001, telemetry.path("metadata").path("registerAddress").asInt());
        assertEquals("MODBUS_TCP", telemetry.path("metadata").path("transport").asText());
        assertEquals(3, telemetry.path("metadata").path("unitId").asInt());

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
    }

    @Test
    void shouldResolveThresholdAlarmAndRecalculateDeviceStatus() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String deviceId = createDevice(session, marker, "5s");
        String registerId = createRegister(session, deviceId, marker);

        ResponseEntity<JsonNode> firstIngest = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "registerId", registerId,
                "metricName", "temperature",
                "metricValue", 95.3,
                "unit", "c"
        ), session);
        assertEquals(200, firstIngest.getStatusCode().value());

        int alarmCount = countRows(
                """
                SELECT COUNT(*)
                FROM iot_alarms
                WHERE tenant_id = ?
                  AND device_id = ?
                  AND register_id = ?
                  AND status IN ('OPEN', 'ACKNOWLEDGED')
                """,
                session.tenantId(),
                deviceId,
                registerId
        );
        assertTrue(alarmCount >= 1);

        ResponseEntity<JsonNode> deviceResponse = get("/iot/devices/" + deviceId, session);
        assertEquals(200, deviceResponse.getStatusCode().value());
        assertTrue(requireBody(deviceResponse).path("data").path("lastSeenAt").asText().length() > 10);
        assertEquals("ALERT", requireBody(deviceResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> secondIngest = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "registerId", registerId,
                "metricName", "temperature",
                "metricValue", 74.1,
                "unit", "c"
        ), session);
        assertEquals(200, secondIngest.getStatusCode().value());

        int openAlarmCountAfterNormalization = countRows(
                """
                SELECT COUNT(*)
                FROM iot_alarms
                WHERE tenant_id = ?
                  AND device_id = ?
                  AND register_id = ?
                  AND status IN ('OPEN', 'ACKNOWLEDGED')
                """,
                session.tenantId(),
                deviceId,
                registerId
        );
        assertEquals(0, openAlarmCountAfterNormalization);

        int resolvedAlarmCount = countRows(
                """
                SELECT COUNT(*)
                FROM iot_alarms
                WHERE tenant_id = ?
                  AND device_id = ?
                  AND register_id = ?
                  AND status = 'RESOLVED'
                """,
                session.tenantId(),
                deviceId,
                registerId
        );
        assertTrue(resolvedAlarmCount >= 1);

        ResponseEntity<JsonNode> refreshedDevice = get("/iot/devices/" + deviceId, session);
        assertEquals(200, refreshedDevice.getStatusCode().value());
        assertEquals("ONLINE", requireBody(refreshedDevice).path("data").path("status").asText());
    }

    @Test
    void shouldMarkTelemetryAsStaleAndDeviceOfflineWhenPollingWindowIsExceeded() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String deviceId = createDevice(session, marker, "5s");

        ResponseEntity<JsonNode> ingestResponse = post("/iot/telemetry", Map.of(
                "deviceId", deviceId,
                "metricName", "temperature",
                "metricValue", 18.5,
                "recordedAt", Instant.now().minusSeconds(180).toString()
        ), session);

        assertEquals(200, ingestResponse.getStatusCode().value());
        assertEquals("STALE", requireBody(ingestResponse).path("data").path("metadata").path("quality").asText());

        ResponseEntity<JsonNode> deviceResponse = get("/iot/devices/" + deviceId, session);
        assertEquals(200, deviceResponse.getStatusCode().value());
        assertEquals("OFFLINE", requireBody(deviceResponse).path("data").path("status").asText());
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

    private String createDevice(AuthSession session, String marker, String pollingProfile) {
        ResponseEntity<JsonNode> createDevice = post("/iot/devices", Map.ofEntries(
                Map.entry("name", "Telemetry-Device-" + marker),
                Map.entry("identifier", "TLM-" + marker),
                Map.entry("status", "ONLINE"),
                Map.entry("transport", "MODBUS_TCP"),
                Map.entry("host", "192.168.10.31"),
                Map.entry("port", 502),
                Map.entry("unitId", 4),
                Map.entry("pollingProfile", pollingProfile)
        ), session);

        assertEquals(200, createDevice.getStatusCode().value());
        return requireBody(createDevice).path("data").path("id").asText();
    }

    private String createRegister(AuthSession session, String deviceId, String marker) {
        ResponseEntity<JsonNode> createRegister = post("/iot/registers", Map.of(
                "deviceId", deviceId,
                "name", "Temperature-" + marker,
                "functionCode", "FC03",
                "registerAddress", 40001,
                "metricName", "temperature",
                "unit", "c",
                "dataType", "DECIMAL",
                "minThreshold", 10.0,
                "maxThreshold", 80.0,
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createRegister.getStatusCode().value());
        return requireBody(createRegister).path("data").path("id").asText();
    }
}

package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IotIntegrationTest extends BaseIntegrationTest {

    @Test
    void shouldCreateAndListDevices() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/iot/devices", Map.of(
                "name", "Device-" + marker,
                "serialNumber", "SN-" + marker,
                "status", "ONLINE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());

        ResponseEntity<JsonNode> listResponse = get("/iot/devices?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);
    }
}

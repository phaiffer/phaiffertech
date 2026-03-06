package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PetIntegrationTest extends BaseIntegrationTest {

    @Test
    void shouldCreateClient() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/pet/clients", Map.of(
                "fullName", "Client " + marker,
                "email", "pet." + marker + "@example.test",
                "phone", "+5511777777777"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());

        ResponseEntity<JsonNode> listResponse = get("/pet/clients?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);
    }
}

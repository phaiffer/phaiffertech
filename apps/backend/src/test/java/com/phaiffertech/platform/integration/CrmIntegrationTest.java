package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmIntegrationTest extends BaseIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteContact() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/crm/contacts", Map.of(
                "firstName", "John" + marker,
                "lastName", "Doe",
                "email", "john." + marker + "@example.test",
                "phone", "+5511999999999",
                "company", "Acme",
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        JsonNode created = requireBody(createResponse).path("data");
        String contactId = created.path("id").asText();
        assertTrue(contactId.length() > 10);

        ResponseEntity<JsonNode> listResponse = get("/crm/contacts?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        JsonNode content = requireBody(listResponse).path("data").path("content");
        assertTrue(content.isArray());
        assertTrue(content.size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/contacts/" + contactId, Map.of(
                "firstName", "Johnny" + marker,
                "lastName", "Doe",
                "email", "johnny." + marker + "@example.test",
                "phone", "+5511888888888",
                "company", "Acme Corp",
                "status", "ACTIVE"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("Johnny" + marker, requireBody(updateResponse).path("data").path("firstName").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/contacts/" + contactId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> listAfterDelete = get("/crm/contacts?page=0&size=20&search=" + marker, session);
        assertEquals(200, listAfterDelete.getStatusCode().value());
        assertEquals(0, requireBody(listAfterDelete).path("data").path("content").size());
    }
}

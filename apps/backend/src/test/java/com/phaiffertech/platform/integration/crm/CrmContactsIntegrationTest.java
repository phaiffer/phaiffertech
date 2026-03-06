package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmContactsIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteContact() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/crm/contacts", Map.of(
                "firstName", "Contact " + marker,
                "lastName", "Local",
                "email", "contact." + marker + "@example.test",
                "phone", "+5511999999999",
                "company", "Acme",
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String contactId = requireBody(createResponse).path("data").path("id").asText();
        assertTrue(contactId.length() > 10);

        ResponseEntity<JsonNode> listResponse = get("/crm/contacts?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/contacts/" + contactId, Map.of(
                "firstName", "Updated " + marker,
                "lastName", "Local",
                "email", "updated." + marker + "@example.test",
                "phone", "+5511888888888",
                "company", "Acme Corp",
                "status", "ACTIVE"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("Updated " + marker, requireBody(updateResponse).path("data").path("firstName").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/contacts/" + contactId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/crm/contacts?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    @Test
    void shouldBlockContactsAccessWhenTenantHeaderDoesNotMatch() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> response = get(
                "/crm/contacts?page=0&size=20",
                session,
                UUID.randomUUID().toString()
        );

        assertEquals(403, response.getStatusCode().value());
    }
}

package com.phaiffertech.platform.integration;

import com.phaiffertech.platform.support.AbstractIntegrationTest;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmIntegrationTest extends AbstractIntegrationTest {

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
        JsonNode items = requireBody(listResponse).path("data").path("items");
        assertTrue(items.isArray());
        assertTrue(items.size() >= 1);

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
        assertEquals(0, requireBody(listAfterDelete).path("data").path("items").size());
    }

    @Test
    void shouldCreateListUpdateAndDeleteLead() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/crm/leads", Map.of(
                "name", "Lead " + marker,
                "email", "lead." + marker + "@example.test",
                "phone", "+5511666666666",
                "source", "WEBSITE",
                "status", "NEW"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String leadId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> getByIdResponse = get("/crm/leads/" + leadId, session);
        assertEquals(200, getByIdResponse.getStatusCode().value());
        assertEquals(leadId, requireBody(getByIdResponse).path("data").path("id").asText());

        ResponseEntity<JsonNode> listResponse = get("/crm/leads?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/leads/" + leadId, Map.of(
                "name", "Lead Updated " + marker,
                "email", "updated." + marker + "@example.test",
                "phone", "+5511555555555",
                "source", "EVENT",
                "status", "QUALIFIED"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("QUALIFIED", requireBody(updateResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/leads/" + leadId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> listAfterDelete = get("/crm/leads?page=0&size=20&search=" + marker, session);
        assertEquals(200, listAfterDelete.getStatusCode().value());
        assertEquals(0, requireBody(listAfterDelete).path("data").path("items").size());
    }
}

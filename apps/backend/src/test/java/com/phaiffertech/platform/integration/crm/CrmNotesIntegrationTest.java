package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmNotesIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteNote() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String companyId = createCompany(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/crm/notes", Map.of(
                "content", "Note " + marker,
                "companyId", companyId
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String noteId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> getResponse = get("/crm/notes/" + noteId, session);
        assertEquals(200, getResponse.getStatusCode().value());
        assertEquals("Note " + marker, requireBody(getResponse).path("data").path("content").asText());

        ResponseEntity<JsonNode> listResponse = get("/crm/notes?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/notes/" + noteId, Map.of(
                "content", "Updated Note " + marker,
                "companyId", companyId
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("Updated Note " + marker, requireBody(updateResponse).path("data").path("content").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/notes/" + noteId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/crm/notes?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    private String createCompany(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Note Company " + marker,
                "document", "NOTE-" + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }
}

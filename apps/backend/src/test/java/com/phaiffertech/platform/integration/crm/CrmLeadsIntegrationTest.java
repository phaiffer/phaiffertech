package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmLeadsIntegrationTest extends AbstractIntegrationTest {

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
                "name", "Updated Lead " + marker,
                "email", "updated." + marker + "@example.test",
                "phone", "+5511555555555",
                "source", "EVENT",
                "status", "QUALIFIED"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("QUALIFIED", requireBody(updateResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/leads/" + leadId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/crm/leads?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }
}

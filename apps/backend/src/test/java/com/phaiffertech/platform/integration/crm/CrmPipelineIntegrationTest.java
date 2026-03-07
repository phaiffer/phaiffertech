package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmPipelineIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeletePipelineStage() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/crm/pipeline-stages", Map.of(
                "name", "Proposal " + marker,
                "position", 10,
                "color", "#123456",
                "isDefault", false
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String stageId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get("/crm/pipeline-stages?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/pipeline-stages/" + stageId, Map.of(
                "name", "Negotiation " + marker,
                "code", "NEGOTIATION_" + marker,
                "position", 11,
                "color", "#654321",
                "isDefault", false
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("Negotiation " + marker, requireBody(updateResponse).path("data").path("name").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/pipeline-stages/" + stageId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/crm/pipeline-stages?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }
}

package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmDealsIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteDeal() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String companyId = createCompany(session, marker);
        String stageId = defaultPipelineStageId(session);

        ResponseEntity<JsonNode> createResponse = post("/crm/deals", Map.of(
                "title", "Deal " + marker,
                "description", "Deal description " + marker,
                "amount", 1500,
                "currency", "BRL",
                "status", "OPEN",
                "companyId", companyId,
                "pipelineStageId", stageId,
                "expectedCloseDate", LocalDate.now().plusDays(10).toString()
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String dealId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> getResponse = get("/crm/deals/" + dealId, session);
        assertEquals(200, getResponse.getStatusCode().value());
        assertEquals("Deal " + marker, requireBody(getResponse).path("data").path("title").asText());

        ResponseEntity<JsonNode> listResponse = get("/crm/deals?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/deals/" + dealId, Map.of(
                "title", "Updated Deal " + marker,
                "description", "Updated description " + marker,
                "amount", 3200,
                "currency", "USD",
                "status", "WON",
                "companyId", companyId,
                "pipelineStageId", stageId,
                "expectedCloseDate", LocalDate.now().plusDays(20).toString()
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("WON", requireBody(updateResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/deals/" + dealId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/crm/deals?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    private String createCompany(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Deal Company " + marker,
                "document", "DEAL-" + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }

    private String defaultPipelineStageId(AuthSession session) {
        ResponseEntity<JsonNode> response = get("/crm/pipeline-stages?page=0&size=20", session);
        return requireBody(response).path("data").path("items").get(0).path("id").asText();
    }
}

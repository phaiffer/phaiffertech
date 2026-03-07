package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmDashboardIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldReturnDashboardSummary() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String companyId = createCompany(session, marker);
        String stageId = defaultPipelineStageId(session);

        post("/crm/leads", Map.of(
                "name", "Lead " + marker,
                "status", "QUALIFIED",
                "source", "WEBSITE",
                "companyId", companyId
        ), session);

        post("/crm/deals", Map.of(
                "title", "Deal " + marker,
                "status", "OPEN",
                "companyId", companyId,
                "pipelineStageId", stageId,
                "currency", "BRL",
                "expectedCloseDate", LocalDate.now().plusDays(7).toString()
        ), session);

        post("/crm/tasks", Map.of(
                "title", "Task " + marker,
                "status", "OPEN",
                "priority", "MEDIUM",
                "dueDate", Instant.now().plusSeconds(86400).toString(),
                "companyId", companyId
        ), session);

        ResponseEntity<JsonNode> response = get("/crm/dashboard/summary", session);
        assertEquals(200, response.getStatusCode().value());

        JsonNode data = requireBody(response).path("data");
        assertTrue(data.path("totalCompanies").asLong() >= 1);
        assertTrue(data.path("totalLeads").asLong() >= 1);
        assertTrue(data.path("totalDeals").asLong() >= 1);
        assertTrue(data.path("tasksPendentes").asLong() >= 1);
        assertTrue(data.path("dealsPorStatus").has("OPEN"));
        assertTrue(data.path("leadsPorStatus").has("QUALIFIED"));
    }

    private String createCompany(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Dashboard Company " + marker,
                "document", "DASH-" + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }

    private String defaultPipelineStageId(AuthSession session) {
        ResponseEntity<JsonNode> response = get("/crm/pipeline-stages?page=0&size=20", session);
        return requireBody(response).path("data").path("items").get(0).path("id").asText();
    }
}

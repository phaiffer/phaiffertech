package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmActivityIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldReturnRecentCrmActivity() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String companyId = createCompany(session, marker);
        String stageId = defaultPipelineStageId(session);
        String petClientId = createPetClient(session, marker);

        post("/crm/contacts", Map.of(
                "firstName", "Contact " + marker,
                "email", "contact." + marker + "@example.test",
                "status", "ACTIVE"
        ), session);

        post("/crm/leads", Map.of(
                "name", "Lead " + marker,
                "status", "NEW",
                "source", "WEBSITE"
        ), session);

        ResponseEntity<JsonNode> createDealResponse = post("/crm/deals", Map.of(
                "title", "Deal " + marker,
                "status", "OPEN",
                "companyId", companyId,
                "pipelineStageId", stageId,
                "currency", "BRL",
                "expectedCloseDate", LocalDate.now().plusDays(5).toString()
        ), session);
        String dealId = requireBody(createDealResponse).path("data").path("id").asText();

        put("/crm/deals/" + dealId, Map.of(
                "title", "Deal Updated " + marker,
                "status", "WON",
                "companyId", companyId,
                "pipelineStageId", stageId,
                "currency", "BRL",
                "expectedCloseDate", LocalDate.now().plusDays(10).toString()
        ), session);

        post("/crm/tasks", Map.of(
                "title", "Task " + marker,
                "status", "OPEN",
                "priority", "HIGH",
                "dueDate", Instant.now().plusSeconds(86400).toString(),
                "relatedReferenceType", "PET.CLIENT",
                "relatedId", petClientId
        ), session);

        post("/crm/notes", Map.of(
                "content", "Note " + marker,
                "companyId", companyId
        ), session);

        ResponseEntity<JsonNode> response = get("/crm/activity?page=0&size=20", session);
        assertEquals(200, response.getStatusCode().value());

        Set<String> eventTypes = new HashSet<>();
        boolean taskEntityFound = false;
        boolean noteEntityFound = false;
        for (JsonNode item : requireBody(response).path("data").path("items")) {
            eventTypes.add(item.path("eventType").asText());
            if ("task.created".equals(item.path("eventType").asText())
                    && ("Pet Activity " + marker).equals(item.path("relatedDisplayName").asText())) {
                assertEquals("CRM.TASK", item.path("entityReferenceType").asText());
                assertEquals("CRM", item.path("entityModule").asText());
                assertEquals("TASK", item.path("entityType").asText());
                assertEquals("PET.CLIENT", item.path("relatedReferenceType").asText());
                assertEquals("PET", item.path("relatedModule").asText());
                assertEquals("CLIENT", item.path("relatedEntityType").asText());
                assertEquals(petClientId, item.path("relatedId").asText());
                assertEquals("Pet Activity " + marker, item.path("relatedDisplayName").asText());
                taskEntityFound = true;
            }
            if ("note.created".equals(item.path("eventType").asText())) {
                assertEquals("CRM.NOTE", item.path("entityReferenceType").asText());
                assertEquals("CRM", item.path("entityModule").asText());
                assertEquals("NOTE", item.path("entityType").asText());
                noteEntityFound = true;
            }
        }

        assertTrue(eventTypes.contains("contact.created"));
        assertTrue(eventTypes.contains("lead.created"));
        assertTrue(eventTypes.contains("deal.updated"));
        assertTrue(eventTypes.contains("task.created"));
        assertTrue(eventTypes.contains("note.created"));
        assertTrue(taskEntityFound);
        assertTrue(noteEntityFound);
    }

    private String createCompany(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Activity Company " + marker,
                "document", "ACT-" + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }

    private String defaultPipelineStageId(AuthSession session) {
        ResponseEntity<JsonNode> response = get("/crm/pipeline-stages?page=0&size=20", session);
        return requireBody(response).path("data").path("items").get(0).path("id").asText();
    }

    private String createPetClient(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/pet/clients", Map.of(
                "name", "Pet Activity " + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }
}

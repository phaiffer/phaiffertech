package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmTasksIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteTask() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String companyId = createCompany(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/crm/tasks", Map.of(
                "title", "Task " + marker,
                "description", "Task description " + marker,
                "dueDate", Instant.now().plusSeconds(86400).toString(),
                "status", "OPEN",
                "priority", "HIGH",
                "companyId", companyId
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("COMPANY", requireBody(createResponse).path("data").path("relatedType").asText());
        assertEquals("CRM.COMPANY", requireBody(createResponse).path("data").path("relatedReferenceType").asText());
        assertEquals("CRM", requireBody(createResponse).path("data").path("relatedModule").asText());
        assertEquals("COMPANY", requireBody(createResponse).path("data").path("relatedEntityType").asText());
        String taskId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> getResponse = get("/crm/tasks/" + taskId, session);
        assertEquals(200, getResponse.getStatusCode().value());
        assertEquals("Task " + marker, requireBody(getResponse).path("data").path("title").asText());
        assertEquals("CRM.COMPANY", requireBody(getResponse).path("data").path("relatedReferenceType").asText());

        ResponseEntity<JsonNode> listResponse = get("/crm/tasks?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/tasks/" + taskId, Map.of(
                "title", "Updated Task " + marker,
                "description", "Updated task description " + marker,
                "dueDate", Instant.now().plusSeconds(172800).toString(),
                "status", "DONE",
                "priority", "LOW",
                "companyId", companyId
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("DONE", requireBody(updateResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/tasks/" + taskId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/crm/tasks?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    @Test
    void shouldAllowExternalPlaceholderRelationForTask() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String externalId = UUID.randomUUID().toString();

        ResponseEntity<JsonNode> createResponse = post("/crm/tasks", Map.of(
                "title", "External Task " + marker,
                "status", "OPEN",
                "priority", "MEDIUM",
                "dueDate", Instant.now().plusSeconds(86400).toString(),
                "relatedReferenceType", "PET.CLIENT",
                "relatedId", externalId
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("PET.CLIENT", requireBody(createResponse).path("data").path("relatedType").asText());
        assertEquals("PET.CLIENT", requireBody(createResponse).path("data").path("relatedReferenceType").asText());
        assertEquals("PET", requireBody(createResponse).path("data").path("relatedModule").asText());
        assertEquals("CLIENT", requireBody(createResponse).path("data").path("relatedEntityType").asText());
        assertEquals(externalId, requireBody(createResponse).path("data").path("relatedId").asText());
        JsonNode companyIdNode = requireBody(createResponse).path("data").path("companyId");
        assertTrue(companyIdNode.isMissingNode() || companyIdNode.isNull() || companyIdNode.asText().isBlank());
    }

    @Test
    void shouldRejectMismatchedExplicitAndCanonicalTaskRelation() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String companyId = createCompany(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/crm/tasks", Map.of(
                "title", "Invalid Task " + marker,
                "status", "OPEN",
                "priority", "HIGH",
                "dueDate", Instant.now().plusSeconds(86400).toString(),
                "companyId", companyId,
                "relatedReferenceType", "PET.CLIENT",
                "relatedId", companyId
        ), session);

        assertEquals(400, createResponse.getStatusCode().value());
        assertEquals("BAD_REQUEST", requireBody(createResponse).path("code").asText());
    }

    private String createCompany(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Task Company " + marker,
                "document", "TASK-" + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }
}

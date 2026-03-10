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

        ResponseEntity<JsonNode> compatibilityFilterResponse = get(
                "/crm/tasks?page=0&size=20&relatedReferenceType=COMPANY&relatedId=" + companyId,
                session
        );
        assertEquals(200, compatibilityFilterResponse.getStatusCode().value());
        assertEquals(taskId, requireBody(compatibilityFilterResponse).path("data").path("items").get(0).path("id").asText());

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
                "relatedReferenceType", "IOT.DEVICE",
                "relatedId", externalId
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("IOT.DEVICE", requireBody(createResponse).path("data").path("relatedType").asText());
        assertEquals("IOT.DEVICE", requireBody(createResponse).path("data").path("relatedReferenceType").asText());
        assertEquals("IOT", requireBody(createResponse).path("data").path("relatedModule").asText());
        assertEquals("DEVICE", requireBody(createResponse).path("data").path("relatedEntityType").asText());
        assertEquals(externalId, requireBody(createResponse).path("data").path("relatedId").asText());
        JsonNode companyIdNode = requireBody(createResponse).path("data").path("companyId");
        assertTrue(companyIdNode.isMissingNode() || companyIdNode.isNull() || companyIdNode.asText().isBlank());
    }

    @Test
    void shouldValidateAndEnrichPetClientRelationForTask() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String petClientId = createPetClient(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/crm/tasks", Map.of(
                "title", "Pet Task " + marker,
                "status", "OPEN",
                "priority", "MEDIUM",
                "dueDate", Instant.now().plusSeconds(86400).toString(),
                "relatedReferenceType", "PET.CLIENT",
                "relatedId", petClientId
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("PET.CLIENT", requireBody(createResponse).path("data").path("relatedReferenceType").asText());
        assertEquals("PET", requireBody(createResponse).path("data").path("relatedModule").asText());
        assertEquals("CLIENT", requireBody(createResponse).path("data").path("relatedEntityType").asText());
        assertEquals("Pet Client " + marker, requireBody(createResponse).path("data").path("relatedDisplayName").asText());
        assertTrue(requireBody(createResponse).path("data").path("relatedDisplayContext").asText().contains("@example.test"));

        ResponseEntity<JsonNode> filteredResponse = get(
                "/crm/tasks?page=0&size=20&relatedReferenceType=PET.CLIENT&relatedId=" + petClientId,
                session
        );
        assertEquals(200, filteredResponse.getStatusCode().value());
        assertEquals(1, requireBody(filteredResponse).path("data").path("items").size());
        assertEquals("PET.CLIENT", requireBody(filteredResponse).path("data").path("items").get(0).path("relatedReferenceType").asText());
    }

    @Test
    void shouldRejectUnknownPetClientRelationForTask() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/crm/tasks", Map.of(
                "title", "Missing Pet Task " + marker,
                "status", "OPEN",
                "priority", "MEDIUM",
                "dueDate", Instant.now().plusSeconds(86400).toString(),
                "relatedReferenceType", "PET.CLIENT",
                "relatedId", UUID.randomUUID().toString()
        ), session);

        assertEquals(404, createResponse.getStatusCode().value());
        assertEquals("NOT_FOUND", requireBody(createResponse).path("code").asText());
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

    private String createPetClient(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/pet/clients", Map.of(
                "name", "Pet Client " + marker,
                "email", "pet." + marker + "@example.test",
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }
}

package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.util.Map;
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
        String taskId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> getResponse = get("/crm/tasks/" + taskId, session);
        assertEquals(200, getResponse.getStatusCode().value());
        assertEquals("Task " + marker, requireBody(getResponse).path("data").path("title").asText());

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

    private String createCompany(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Task Company " + marker,
                "document", "TASK-" + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }
}

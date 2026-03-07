package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SharedCrudBehaviorIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldApplyBaseCrudSoftDeletePaginationAndTenantFilterForContacts() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createFirst = post("/crm/contacts", Map.of(
                "firstName", "Shared " + marker + " A",
                "email", "shared-a." + marker + "@example.test",
                "status", "ACTIVE"
        ), session);
        ResponseEntity<JsonNode> createSecond = post("/crm/contacts", Map.of(
                "firstName", "Shared " + marker + " B",
                "email", "shared-b." + marker + "@example.test",
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createFirst.getStatusCode().value());
        assertEquals(200, createSecond.getStatusCode().value());

        String firstId = requireBody(createFirst).path("data").path("id").asText();

        ResponseEntity<JsonNode> firstPage = get(
                "/crm/contacts?page=0&size=1&sort=createdAt&direction=asc&search=" + marker,
                session
        );
        ResponseEntity<JsonNode> secondPage = get(
                "/crm/contacts?page=1&size=1&sort=createdAt&direction=asc&search=" + marker,
                session
        );

        assertEquals(200, firstPage.getStatusCode().value());
        assertEquals(200, secondPage.getStatusCode().value());
        assertEquals(1, requireBody(firstPage).path("data").path("items").size());
        assertEquals(1, requireBody(secondPage).path("data").path("items").size());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/contacts/" + firstId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        int deletedRows = countRows(
                "SELECT COUNT(*) FROM crm_contacts WHERE id = ? AND deleted_at IS NOT NULL",
                firstId
        );
        assertEquals(1, deletedRows);

        ResponseEntity<JsonNode> afterDelete = get(
                "/crm/contacts?page=0&size=20&search=" + marker,
                session
        );
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(1, requireBody(afterDelete).path("data").path("items").size());

        ResponseEntity<JsonNode> wrongTenantResponse = get(
                "/crm/contacts?page=0&size=20",
                session,
                UUID.randomUUID().toString()
        );
        assertEquals(403, wrongTenantResponse.getStatusCode().value());

        assertTrue(requireBody(afterDelete).path("data").path("totalItems").asInt() >= 1);
    }
}

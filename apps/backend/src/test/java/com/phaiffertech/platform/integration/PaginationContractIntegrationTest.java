package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PaginationContractIntegrationTest extends BaseIntegrationTest {

    @Test
    void shouldExposeStandardAndLegacyPaginationFieldsForContactsLeadsPetAndIot() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        post("/crm/contacts", Map.of(
                "firstName", "Contact-" + marker,
                "status", "ACTIVE"
        ), session);

        post("/crm/leads", Map.of(
                "name", "Lead-" + marker,
                "status", "NEW"
        ), session);

        post("/pet/clients", Map.of(
                "fullName", "Pet Client " + marker
        ), session);

        post("/iot/devices", Map.of(
                "name", "Device-" + marker,
                "serialNumber", "SERIAL-" + marker,
                "status", "ONLINE"
        ), session);

        assertStandardPage(get("/crm/contacts?page=0&size=10&sort=createdAt&direction=desc&search=" + marker, session), true);
        assertStandardPage(get("/crm/leads?page=0&size=10&sort=createdAt&direction=desc&search=" + marker, session), true);
        assertStandardPage(get("/pet/clients?page=0&size=10&sort=createdAt&direction=desc&search=" + marker, session), true);
        assertStandardPage(get("/iot/devices?page=0&size=10&sort=createdAt&direction=desc&search=" + marker, session), true);
    }

    private void assertStandardPage(ResponseEntity<JsonNode> response, boolean expectAtLeastOneItem) {
        assertEquals(200, response.getStatusCode().value());
        JsonNode data = requireBody(response).path("data");

        assertTrue(data.path("items").isArray());
        assertTrue(data.path("content").isArray());
        assertTrue(data.path("page").isInt());
        assertTrue(data.path("size").isInt());
        assertTrue(data.path("totalItems").isNumber());
        assertTrue(data.path("totalElements").isNumber());
        assertTrue(data.path("totalPages").isInt());

        if (expectAtLeastOneItem) {
            assertTrue(data.path("items").size() >= 1);
            assertTrue(data.path("content").size() >= 1);
        }
    }
}

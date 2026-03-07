package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmCompaniesIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteCompany() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/crm/companies", Map.of(
                "name", "Company " + marker,
                "legalName", "Company Legal " + marker,
                "document", "DOC-" + marker,
                "email", "company." + marker + "@example.test",
                "phone", "+5511999999999",
                "website", "https://company-" + marker + ".example.test",
                "industry", "SAAS",
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String companyId = requireBody(createResponse).path("data").path("id").asText();
        assertTrue(companyId.length() > 10);

        ResponseEntity<JsonNode> getResponse = get("/crm/companies/" + companyId, session);
        assertEquals(200, getResponse.getStatusCode().value());
        assertEquals("Company " + marker, requireBody(getResponse).path("data").path("name").asText());

        ResponseEntity<JsonNode> listResponse = get("/crm/companies?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/companies/" + companyId, Map.of(
                "name", "Updated Company " + marker,
                "legalName", "Updated Legal " + marker,
                "document", "DOC-" + marker,
                "email", "updated-company." + marker + "@example.test",
                "phone", "+5511888888888",
                "website", "https://updated-company-" + marker + ".example.test",
                "industry", "CONSULTING",
                "status", "ACTIVE"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("Updated Company " + marker, requireBody(updateResponse).path("data").path("name").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/companies/" + companyId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/crm/companies?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }
}

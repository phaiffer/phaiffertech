package com.phaiffertech.platform.integration.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrmNotesIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteNote() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String companyId = createCompany(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/crm/notes", Map.of(
                "content", "Note " + marker,
                "companyId", companyId
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("COMPANY", requireBody(createResponse).path("data").path("relatedType").asText());
        assertEquals("CRM.COMPANY", requireBody(createResponse).path("data").path("relatedReferenceType").asText());
        assertEquals("CRM", requireBody(createResponse).path("data").path("relatedModule").asText());
        assertEquals("COMPANY", requireBody(createResponse).path("data").path("relatedEntityType").asText());
        String noteId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> getResponse = get("/crm/notes/" + noteId, session);
        assertEquals(200, getResponse.getStatusCode().value());
        assertEquals("Note " + marker, requireBody(getResponse).path("data").path("content").asText());
        assertEquals("CRM.COMPANY", requireBody(getResponse).path("data").path("relatedReferenceType").asText());

        ResponseEntity<JsonNode> listResponse = get("/crm/notes?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/crm/notes/" + noteId, Map.of(
                "content", "Updated Note " + marker,
                "companyId", companyId
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("Updated Note " + marker, requireBody(updateResponse).path("data").path("content").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/crm/notes/" + noteId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDelete = get("/crm/notes?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDelete.getStatusCode().value());
        assertEquals(0, requireBody(afterDelete).path("data").path("items").size());
    }

    @Test
    void shouldAllowExternalPlaceholderRelationForNote() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String externalId = UUID.randomUUID().toString();

        ResponseEntity<JsonNode> createResponse = post("/crm/notes", Map.of(
                "content", "External Note " + marker,
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
    void shouldValidateAndEnrichPetProfileRelationForNote() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String petProfileId = createPetProfile(session, marker);

        ResponseEntity<JsonNode> createResponse = post("/crm/notes", Map.of(
                "content", "Pet Note " + marker,
                "relatedReferenceType", "PET.PROFILE",
                "relatedId", petProfileId
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("PET.PROFILE", requireBody(createResponse).path("data").path("relatedReferenceType").asText());
        assertEquals("PET", requireBody(createResponse).path("data").path("relatedModule").asText());
        assertEquals("PROFILE", requireBody(createResponse).path("data").path("relatedEntityType").asText());
        assertEquals("Pet Profile " + marker, requireBody(createResponse).path("data").path("relatedDisplayName").asText());
        assertTrue(requireBody(createResponse).path("data").path("relatedDisplayContext").asText().contains("Pet Owner " + marker));
    }

    private String createCompany(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Note Company " + marker,
                "document", "NOTE-" + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }

    private String createPetProfile(AuthSession session, String marker) {
        ResponseEntity<JsonNode> clientResponse = post("/pet/clients", Map.of(
                "name", "Pet Owner " + marker,
                "status", "ACTIVE"
        ), session);
        String clientId = requireBody(clientResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> profileResponse = post("/pet/pets", Map.of(
                "clientId", clientId,
                "name", "Pet Profile " + marker,
                "species", "DOG"
        ), session);
        return requireBody(profileResponse).path("data").path("id").asText();
    }
}

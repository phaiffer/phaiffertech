package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PetIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldCreateListUpdateAndDeleteClient() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/pet/clients", Map.of(
                "name", "Client " + marker,
                "email", "pet." + marker + "@example.test",
                "phone", "+5511777777777",
                "document", "DOC-" + marker,
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String clientId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get("/pet/clients?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/pet/clients/" + clientId, Map.of(
                "name", "Updated Client " + marker,
                "email", "updated.pet." + marker + "@example.test",
                "phone", "+5511888888888",
                "document", "DOC-UPDATED-" + marker,
                "status", "INACTIVE"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("INACTIVE", requireBody(updateResponse).path("data").path("status").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/pet/clients/" + clientId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());

        ResponseEntity<JsonNode> afterDeleteResponse = get("/pet/clients?page=0&size=20&search=" + marker, session);
        assertEquals(200, afterDeleteResponse.getStatusCode().value());
        assertEquals(0, requireBody(afterDeleteResponse).path("data").path("items").size());

        int deletedCount = countRows(
                "SELECT COUNT(*) FROM pet_clients WHERE id = ? AND deleted_at IS NOT NULL",
                clientId
        );
        assertEquals(1, deletedCount);
    }

    @Test
    void shouldCreatePetProfileAndAppointment() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createClient = post("/pet/clients", Map.of(
                "name", "Owner " + marker,
                "status", "ACTIVE"
        ), session);
        assertEquals(200, createClient.getStatusCode().value());
        String clientId = requireBody(createClient).path("data").path("id").asText();

        ResponseEntity<JsonNode> createPet = post("/pet/pets", Map.of(
                "clientId", clientId,
                "name", "Pet " + marker,
                "species", "DOG",
                "breed", "MIXED",
                "birthDate", LocalDate.now().minusYears(2).toString(),
                "gender", "MALE",
                "weight", 12.40,
                "notes", "Healthy"
        ), session);
        assertEquals(200, createPet.getStatusCode().value());
        String petId = requireBody(createPet).path("data").path("id").asText();

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "serviceName", "Bath " + marker,
                "status", "SCHEDULED",
                "notes", "Initial appointment"
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());
        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();

        ResponseEntity<JsonNode> getPetResponse = get("/pet/pets/" + petId, session);
        assertEquals(200, getPetResponse.getStatusCode().value());
        assertEquals(clientId, requireBody(getPetResponse).path("data").path("clientId").asText());

        ResponseEntity<JsonNode> listAppointments = get(
                "/pet/appointments?page=0&size=20&status=SCHEDULED&search=" + marker,
                session
        );
        assertEquals(200, listAppointments.getStatusCode().value());
        assertTrue(requireBody(listAppointments).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateAppointment = put("/pet/appointments/" + appointmentId, Map.of(
                "clientId", clientId,
                "petId", petId,
                "scheduledAt", Instant.now().plusSeconds(7200).toString(),
                "serviceName", "Bath " + marker,
                "status", "COMPLETED",
                "notes", "Completed successfully"
        ), session);
        assertEquals(200, updateAppointment.getStatusCode().value());
        assertEquals("COMPLETED", requireBody(updateAppointment).path("data").path("status").asText());
    }

    @Test
    void shouldBlockPetRequestsWhenTenantHeaderDoesNotMatchAuthenticatedTenant() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> response = get(
                "/pet/clients?page=0&size=20",
                session,
                UUID.randomUUID().toString()
        );

        assertEquals(403, response.getStatusCode().value());
    }
}

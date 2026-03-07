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
                "address", "Street " + marker,
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
                "address", "Avenue " + marker,
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

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String serviceId = createService(session, marker);
        String professionalId = createProfessional(session, marker);

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "SCHEDULED",
                "notes", "Initial appointment"
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());
        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();

        ResponseEntity<JsonNode> getPetResponse = get("/pet/pets/" + petId, session);
        assertEquals(200, getPetResponse.getStatusCode().value());
        assertEquals(clientId, requireBody(getPetResponse).path("data").path("clientId").asText());

        ResponseEntity<JsonNode> listAppointments = get(
                "/pet/appointments?page=0&size=20&status=SCHEDULED&serviceId=" + serviceId
                        + "&professionalId=" + professionalId
                        + "&search=" + marker,
                session
        );
        assertEquals(200, listAppointments.getStatusCode().value());
        assertTrue(requireBody(listAppointments).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateAppointment = put("/pet/appointments/" + appointmentId, Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(7200).toString(),
                "status", "COMPLETED",
                "notes", "Completed successfully"
        ), session);
        assertEquals(200, updateAppointment.getStatusCode().value());
        assertEquals("COMPLETED", requireBody(updateAppointment).path("data").path("status").asText());
        assertEquals(serviceId, requireBody(updateAppointment).path("data").path("serviceId").asText());
    }

    @Test
    void shouldCreateUpdateAndDeleteServiceCatalog() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Description " + marker,
                "price", 95.50,
                "durationMinutes", 45
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String serviceId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get("/pet/services?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/pet/services/" + serviceId, Map.of(
                "name", "Service Updated " + marker,
                "description", "Updated " + marker,
                "price", 120.00,
                "durationMinutes", 60
        ), session);
        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("Service Updated " + marker, requireBody(updateResponse).path("data").path("name").asText());

        ResponseEntity<JsonNode> deleteResponse = delete("/pet/services/" + serviceId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());
    }

    @Test
    void shouldCreateMedicalRecordVaccinationAndPrescription() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String professionalId = createProfessional(session, marker);

        ResponseEntity<JsonNode> createMedicalRecord = post("/pet/medical-records", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "description", "Consultation " + marker,
                "diagnosis", "Diagnosis " + marker,
                "treatment", "Treatment " + marker
        ), session);
        assertEquals(200, createMedicalRecord.getStatusCode().value());

        ResponseEntity<JsonNode> createVaccination = post("/pet/vaccinations", Map.of(
                "petId", petId,
                "vaccineName", "Vaccine " + marker,
                "appliedAt", Instant.now().toString(),
                "nextDueAt", Instant.now().plusSeconds(86400L * 30).toString(),
                "notes", "Dose 1"
        ), session);
        assertEquals(200, createVaccination.getStatusCode().value());

        ResponseEntity<JsonNode> createPrescription = post("/pet/prescriptions", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "medication", "Medication " + marker,
                "dosage", "2x daily",
                "instructions", "After meals"
        ), session);
        assertEquals(200, createPrescription.getStatusCode().value());

        ResponseEntity<JsonNode> listMedicalRecords = get(
                "/pet/medical-records?page=0&size=20&petId=" + petId + "&search=" + marker,
                session
        );
        assertEquals(200, listMedicalRecords.getStatusCode().value());
        assertEquals(1, requireBody(listMedicalRecords).path("data").path("items").size());

        ResponseEntity<JsonNode> listVaccinations = get(
                "/pet/vaccinations?page=0&size=20&petId=" + petId + "&search=" + marker,
                session
        );
        assertEquals(200, listVaccinations.getStatusCode().value());
        assertEquals(1, requireBody(listVaccinations).path("data").path("items").size());

        ResponseEntity<JsonNode> listPrescriptions = get(
                "/pet/prescriptions?page=0&size=20&petId=" + petId + "&search=" + marker,
                session
        );
        assertEquals(200, listPrescriptions.getStatusCode().value());
        assertEquals(1, requireBody(listPrescriptions).path("data").path("items").size());
    }

    @Test
    void shouldCreateProductManageInventoryAndInvoice() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);

        ResponseEntity<JsonNode> createProduct = post("/pet/products", Map.of(
                "name", "Product " + marker,
                "sku", "SKU-" + marker,
                "price", 35.90,
                "stockQuantity", 10
        ), session);
        assertEquals(200, createProduct.getStatusCode().value());
        String productId = requireBody(createProduct).path("data").path("id").asText();

        ResponseEntity<JsonNode> createInventory = post("/pet/inventory", Map.of(
                "productId", productId,
                "movementType", "IN",
                "quantity", 5,
                "notes", "Restock " + marker
        ), session);
        assertEquals(200, createInventory.getStatusCode().value());
        String inventoryId = requireBody(createInventory).path("data").path("id").asText();

        ResponseEntity<JsonNode> productAfterMovement = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterMovement.getStatusCode().value());
        assertEquals(15, requireBody(productAfterMovement).path("data").path("stockQuantity").asInt());

        ResponseEntity<JsonNode> updateInventory = put("/pet/inventory/" + inventoryId, Map.of(
                "productId", productId,
                "movementType", "OUT",
                "quantity", 2,
                "notes", "Usage " + marker
        ), session);
        assertEquals(200, updateInventory.getStatusCode().value());

        ResponseEntity<JsonNode> productAfterUpdate = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterUpdate.getStatusCode().value());
        assertEquals(8, requireBody(productAfterUpdate).path("data").path("stockQuantity").asInt());

        ResponseEntity<JsonNode> deleteInventory = delete("/pet/inventory/" + inventoryId, session);
        assertEquals(200, deleteInventory.getStatusCode().value());

        ResponseEntity<JsonNode> productAfterDelete = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterDelete.getStatusCode().value());
        assertEquals(10, requireBody(productAfterDelete).path("data").path("stockQuantity").asInt());

        ResponseEntity<JsonNode> createInvoice = post("/pet/invoices", Map.of(
                "clientId", clientId,
                "totalAmount", 199.90,
                "status", "PAID",
                "issuedAt", Instant.now().toString()
        ), session);
        assertEquals(200, createInvoice.getStatusCode().value());
        String invoiceId = requireBody(createInvoice).path("data").path("id").asText();

        ResponseEntity<JsonNode> listProducts = get("/pet/products?page=0&size=20&search=" + marker, session);
        assertEquals(200, listProducts.getStatusCode().value());
        assertTrue(requireBody(listProducts).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> listInventory = get(
                "/pet/inventory?page=0&size=20&productId=" + productId + "&search=" + marker,
                session
        );
        assertEquals(200, listInventory.getStatusCode().value());
        assertEquals(0, requireBody(listInventory).path("data").path("items").size());

        ResponseEntity<JsonNode> listInvoices = get(
                "/pet/invoices?page=0&size=20&clientId=" + clientId + "&status=PAID&search=PAI",
                session
        );
        assertEquals(200, listInvoices.getStatusCode().value());
        assertEquals(1, requireBody(listInvoices).path("data").path("items").size());

        ResponseEntity<JsonNode> getInvoice = get("/pet/invoices/" + invoiceId, session);
        assertEquals(200, getInvoice.getStatusCode().value());
        assertEquals("PAID", requireBody(getInvoice).path("data").path("status").asText());
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

    private String createClient(AuthSession session, String marker) {
        ResponseEntity<JsonNode> createClient = post("/pet/clients", Map.of(
                "name", "Owner " + marker,
                "email", "owner." + marker + "@example.test",
                "phone", "+5511999999999",
                "document", "DOC-" + marker,
                "address", "Address " + marker,
                "status", "ACTIVE"
        ), session);
        assertEquals(200, createClient.getStatusCode().value());
        return requireBody(createClient).path("data").path("id").asText();
    }

    private String createPet(AuthSession session, String clientId, String marker) {
        ResponseEntity<JsonNode> createPet = post("/pet/pets", Map.of(
                "clientId", clientId,
                "name", "Pet " + marker,
                "species", "DOG",
                "breed", "MIXED",
                "birthDate", LocalDate.now().minusYears(2).toString(),
                "gender", "MALE",
                "weight", 12.40,
                "color", "Brown",
                "notes", "Healthy"
        ), session);
        assertEquals(200, createPet.getStatusCode().value());
        return requireBody(createPet).path("data").path("id").asText();
    }

    private String createService(AuthSession session, String marker) {
        ResponseEntity<JsonNode> createService = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Routine " + marker,
                "price", 89.90,
                "durationMinutes", 40
        ), session);
        assertEquals(200, createService.getStatusCode().value());
        return requireBody(createService).path("data").path("id").asText();
    }

    private String createProfessional(AuthSession session, String marker) {
        ResponseEntity<JsonNode> createProfessional = post("/pet/professionals", Map.of(
                "name", "Professional " + marker,
                "specialty", "Vet",
                "licenseNumber", "LIC-" + marker,
                "phone", "+5511888888888",
                "email", "professional." + marker + "@example.test"
        ), session);
        assertEquals(200, createProfessional.getStatusCode().value());
        return requireBody(createProfessional).path("data").path("id").asText();
    }
}

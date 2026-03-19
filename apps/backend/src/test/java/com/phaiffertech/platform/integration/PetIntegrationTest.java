package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
        assertEquals("Owner " + marker, requireBody(createAppointment).path("data").path("clientName").asText());
        assertEquals("Pet " + marker, requireBody(createAppointment).path("data").path("petName").asText());
        assertEquals("Professional " + marker, requireBody(createAppointment).path("data").path("professionalName").asText());
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
        assertEquals("Owner " + marker, requireBody(listAppointments).path("data").path("items").get(0).path("clientName").asText());
        assertEquals("Pet " + marker, requireBody(listAppointments).path("data").path("items").get(0).path("petName").asText());
        assertEquals("Professional " + marker, requireBody(listAppointments).path("data").path("items").get(0).path("professionalName").asText());

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
        assertEquals("Owner " + marker, requireBody(updateAppointment).path("data").path("clientName").asText());
        assertEquals("Pet " + marker, requireBody(updateAppointment).path("data").path("petName").asText());
        assertEquals("Professional " + marker, requireBody(updateAppointment).path("data").path("professionalName").asText());
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
        String serviceId = createService(session, marker);
        String professionalId = createProfessional(session, marker);
        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(1800).toString(),
                "status", "SCHEDULED",
                "notes", "Clinical workflow " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());
        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();

        ResponseEntity<JsonNode> createMedicalRecord = post("/pet/medical-records", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "appointmentId", appointmentId,
                "description", "Consultation " + marker,
                "diagnosis", "Diagnosis " + marker,
                "treatment", "Treatment " + marker
        ), session);
        assertEquals(200, createMedicalRecord.getStatusCode().value());
        assertEquals("Pet " + marker, requireBody(createMedicalRecord).path("data").path("petName").asText());
        assertEquals("Professional " + marker, requireBody(createMedicalRecord).path("data").path("professionalName").asText());
        assertEquals(appointmentId, requireBody(createMedicalRecord).path("data").path("appointmentId").asText());
        assertEquals("Service " + marker, requireBody(createMedicalRecord).path("data").path("appointmentServiceName").asText());

        ResponseEntity<JsonNode> createVaccination = post("/pet/vaccinations", Map.of(
                "petId", petId,
                "appointmentId", appointmentId,
                "vaccineName", "Vaccine " + marker,
                "appliedAt", Instant.now().toString(),
                "nextDueAt", Instant.now().plusSeconds(86400L * 30).toString(),
                "notes", "Dose 1"
        ), session);
        assertEquals(200, createVaccination.getStatusCode().value());
        assertEquals("Pet " + marker, requireBody(createVaccination).path("data").path("petName").asText());
        assertEquals(appointmentId, requireBody(createVaccination).path("data").path("appointmentId").asText());
        assertEquals("Service " + marker, requireBody(createVaccination).path("data").path("appointmentServiceName").asText());

        ResponseEntity<JsonNode> createPrescription = post("/pet/prescriptions", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "appointmentId", appointmentId,
                "medication", "Medication " + marker,
                "dosage", "2x daily",
                "instructions", "After meals"
        ), session);
        assertEquals(200, createPrescription.getStatusCode().value());
        assertEquals("Pet " + marker, requireBody(createPrescription).path("data").path("petName").asText());
        assertEquals("Professional " + marker, requireBody(createPrescription).path("data").path("professionalName").asText());
        assertEquals(appointmentId, requireBody(createPrescription).path("data").path("appointmentId").asText());
        assertEquals("Service " + marker, requireBody(createPrescription).path("data").path("appointmentServiceName").asText());

        ResponseEntity<JsonNode> listMedicalRecords = get(
                "/pet/medical-records?page=0&size=20&petId=" + petId + "&appointmentId=" + appointmentId + "&search=" + marker,
                session
        );
        assertEquals(200, listMedicalRecords.getStatusCode().value());
        assertEquals(1, requireBody(listMedicalRecords).path("data").path("items").size());
        assertEquals("Pet " + marker, requireBody(listMedicalRecords).path("data").path("items").get(0).path("petName").asText());
        assertEquals("Professional " + marker, requireBody(listMedicalRecords).path("data").path("items").get(0).path("professionalName").asText());
        assertEquals(appointmentId, requireBody(listMedicalRecords).path("data").path("items").get(0).path("appointmentId").asText());

        ResponseEntity<JsonNode> listVaccinations = get(
                "/pet/vaccinations?page=0&size=20&petId=" + petId + "&appointmentId=" + appointmentId + "&search=" + marker,
                session
        );
        assertEquals(200, listVaccinations.getStatusCode().value());
        assertEquals(1, requireBody(listVaccinations).path("data").path("items").size());
        assertEquals("Pet " + marker, requireBody(listVaccinations).path("data").path("items").get(0).path("petName").asText());
        assertEquals(appointmentId, requireBody(listVaccinations).path("data").path("items").get(0).path("appointmentId").asText());

        ResponseEntity<JsonNode> listPrescriptions = get(
                "/pet/prescriptions?page=0&size=20&petId=" + petId + "&appointmentId=" + appointmentId + "&search=" + marker,
                session
        );
        assertEquals(200, listPrescriptions.getStatusCode().value());
        assertEquals(1, requireBody(listPrescriptions).path("data").path("items").size());
        assertEquals("Pet " + marker, requireBody(listPrescriptions).path("data").path("items").get(0).path("petName").asText());
        assertEquals("Professional " + marker, requireBody(listPrescriptions).path("data").path("items").get(0).path("professionalName").asText());
        assertEquals(appointmentId, requireBody(listPrescriptions).path("data").path("items").get(0).path("appointmentId").asText());

        ResponseEntity<JsonNode> getAppointment = get("/pet/appointments/" + appointmentId, session);
        assertEquals(200, getAppointment.getStatusCode().value());
        assertEquals(1, requireBody(getAppointment).path("data").path("medicalRecordCount").asInt());
        assertEquals(1, requireBody(getAppointment).path("data").path("vaccinationCount").asInt());
        assertEquals(1, requireBody(getAppointment).path("data").path("prescriptionCount").asInt());
    }

    @Test
    void shouldRejectClinicalWorkflowForCanceledAppointment() {
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
                "scheduledAt", Instant.now().plusSeconds(2400).toString(),
                "status", "CANCELED",
                "notes", "Canceled clinical workflow " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());
        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();

        ResponseEntity<JsonNode> createMedicalRecord = post("/pet/medical-records", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "appointmentId", appointmentId,
                "description", "Canceled consultation " + marker
        ), session);
        assertEquals(409, createMedicalRecord.getStatusCode().value());
        assertEquals("CONFLICT", requireBody(createMedicalRecord).path("code").asText());
    }

    @Test
    void shouldReturnConsolidatedClinicalTimelineForAppointmentAndPet() {
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
                "scheduledAt", Instant.now().plusSeconds(1800).toString(),
                "status", "CONFIRMED",
                "notes", "Timeline workflow " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());
        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();

        ResponseEntity<JsonNode> createLinkedRecord = post("/pet/medical-records", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "appointmentId", appointmentId,
                "description", "Clinical summary " + marker,
                "diagnosis", "Diagnosis " + marker,
                "treatment", "Treatment " + marker
        ), session);
        assertEquals(200, createLinkedRecord.getStatusCode().value());

        ResponseEntity<JsonNode> createVaccination = post("/pet/vaccinations", Map.of(
                "petId", petId,
                "appointmentId", appointmentId,
                "vaccineName", "Vaccine " + marker,
                "appliedAt", Instant.now().plusSeconds(7200).toString(),
                "notes", "Dose 1 " + marker
        ), session);
        assertEquals(200, createVaccination.getStatusCode().value());

        ResponseEntity<JsonNode> createPrescription = post("/pet/prescriptions", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "appointmentId", appointmentId,
                "medication", "Medication " + marker,
                "dosage", "2x daily"
        ), session);
        assertEquals(200, createPrescription.getStatusCode().value());

        ResponseEntity<JsonNode> createStandaloneRecord = post("/pet/medical-records", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "description", "Follow-up " + marker,
                "diagnosis", "Return " + marker
        ), session);
        assertEquals(200, createStandaloneRecord.getStatusCode().value());

        ResponseEntity<JsonNode> appointmentTimeline = get(
                "/pet/medical/timeline?appointmentId=" + appointmentId + "&limit=10",
                session
        );
        assertEquals(200, appointmentTimeline.getStatusCode().value());

        JsonNode appointmentTimelineData = requireBody(appointmentTimeline).path("data");
        assertEquals(appointmentId, appointmentTimelineData.path("appointmentId").asText());
        assertEquals(petId, appointmentTimelineData.path("petId").asText());
        assertEquals(3, appointmentTimelineData.path("totalEvents").asInt());
        assertEquals(3, appointmentTimelineData.path("events").size());
        assertEquals("VACCINATION", appointmentTimelineData.path("events").get(0).path("eventType").asText());
        assertTrue(appointmentTimelineData.path("events").findValuesAsText("eventType").contains("MEDICAL_RECORD"));
        assertTrue(appointmentTimelineData.path("events").findValuesAsText("eventType").contains("PRESCRIPTION"));
        assertEquals("Service " + marker, appointmentTimelineData.path("events").get(0).path("appointmentServiceName").asText());

        ResponseEntity<JsonNode> petTimeline = get(
                "/pet/medical/timeline?petId=" + petId + "&limit=10",
                session
        );
        assertEquals(200, petTimeline.getStatusCode().value());

        JsonNode petTimelineData = requireBody(petTimeline).path("data");
        assertEquals(petId, petTimelineData.path("petId").asText());
        assertEquals("Pet " + marker, petTimelineData.path("petName").asText());
        assertEquals(4, petTimelineData.path("totalEvents").asInt());
        assertEquals(4, petTimelineData.path("events").size());
        assertTrue(petTimelineData.path("events").findValuesAsText("eventType").contains("MEDICAL_RECORD"));
        assertTrue(petTimelineData.path("events").findValuesAsText("eventType").contains("VACCINATION"));
        assertTrue(petTimelineData.path("events").findValuesAsText("eventType").contains("PRESCRIPTION"));
        assertTrue(
                petTimelineData.path("events").findValuesAsText("summary").stream()
                        .anyMatch(value -> value.contains("Clinical summary " + marker))
        );
    }

    @Test
    void shouldRejectClinicalTimelineWithoutPetOrAppointmentContext() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> response = get("/pet/medical/timeline", session);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("BAD_REQUEST", requireBody(response).path("code").asText());
    }

    @Test
    void shouldProtectAppointmentRelationshipsOnceClinicalWorkflowStarts() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String otherClientId = createClient(session, marker + "-other");
        String otherPetId = createPet(session, otherClientId, marker + "-other");
        String serviceId = createService(session, marker);
        String otherServiceId = createService(session, marker + "-other");
        String professionalId = createProfessional(session, marker);
        String otherProfessionalId = createProfessional(session, marker + "-other");

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3000).toString(),
                "status", "SCHEDULED",
                "notes", "Protected workflow " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());
        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();

        ResponseEntity<JsonNode> createPrescription = post("/pet/prescriptions", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "appointmentId", appointmentId,
                "medication", "Medication " + marker
        ), session);
        assertEquals(200, createPrescription.getStatusCode().value());

        ResponseEntity<JsonNode> updateAppointment = put("/pet/appointments/" + appointmentId, Map.of(
                "clientId", otherClientId,
                "petId", otherPetId,
                "serviceId", otherServiceId,
                "professionalId", otherProfessionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "CONFIRMED",
                "notes", "Attempted relation change " + marker
        ), session);
        assertEquals(409, updateAppointment.getStatusCode().value());
        assertEquals("CONFLICT", requireBody(updateAppointment).path("code").asText());

        ResponseEntity<JsonNode> deleteAppointment = delete("/pet/appointments/" + appointmentId, session);
        assertEquals(409, deleteAppointment.getStatusCode().value());
        assertEquals("CONFLICT", requireBody(deleteAppointment).path("code").asText());
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
        assertEquals("Product " + marker, requireBody(createInventory).path("data").path("productName").asText());
        assertEquals(("SKU-" + marker).toUpperCase(), requireBody(createInventory).path("data").path("productSku").asText());
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
        assertEquals("Product " + marker, requireBody(updateInventory).path("data").path("productName").asText());
        assertEquals(("SKU-" + marker).toUpperCase(), requireBody(updateInventory).path("data").path("productSku").asText());

        ResponseEntity<JsonNode> productAfterUpdate = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterUpdate.getStatusCode().value());
        assertEquals(8, requireBody(productAfterUpdate).path("data").path("stockQuantity").asInt());

        ResponseEntity<JsonNode> createInvoice = post("/pet/invoices", Map.of(
                "clientId", clientId,
                "totalAmount", 199.90,
                "status", "PAID",
                "issuedAt", Instant.now().toString()
        ), session);
        assertEquals(200, createInvoice.getStatusCode().value());
        assertEquals("Owner " + marker, requireBody(createInvoice).path("data").path("clientName").asText());
        String invoiceId = requireBody(createInvoice).path("data").path("id").asText();

        ResponseEntity<JsonNode> listProducts = get("/pet/products?page=0&size=20&search=" + marker, session);
        assertEquals(200, listProducts.getStatusCode().value());
        assertTrue(requireBody(listProducts).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> listInventoryBeforeDelete = get(
                "/pet/inventory?page=0&size=20&productId=" + productId + "&search=" + marker,
                session
        );
        assertEquals(200, listInventoryBeforeDelete.getStatusCode().value());
        assertEquals(1, requireBody(listInventoryBeforeDelete).path("data").path("items").size());
        assertEquals("Product " + marker, requireBody(listInventoryBeforeDelete).path("data").path("items").get(0).path("productName").asText());
        assertEquals(("SKU-" + marker).toUpperCase(), requireBody(listInventoryBeforeDelete).path("data").path("items").get(0).path("productSku").asText());

        ResponseEntity<JsonNode> deleteInventory = delete("/pet/inventory/" + inventoryId, session);
        assertEquals(200, deleteInventory.getStatusCode().value());

        ResponseEntity<JsonNode> productAfterDelete = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterDelete.getStatusCode().value());
        assertEquals(10, requireBody(productAfterDelete).path("data").path("stockQuantity").asInt());

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
        assertEquals("Owner " + marker, requireBody(listInvoices).path("data").path("items").get(0).path("clientName").asText());

        ResponseEntity<JsonNode> getInvoice = get("/pet/invoices/" + invoiceId, session);
        assertEquals(200, getInvoice.getStatusCode().value());
        assertEquals("PAID", requireBody(getInvoice).path("data").path("status").asText());
        assertEquals("Owner " + marker, requireBody(getInvoice).path("data").path("clientName").asText());
    }

    @Test
    void shouldUseSharedInventoryFoundationForVeterinarySupplies() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createProduct = post("/pet/products", Map.of(
                "name", "Clinical Supply " + marker,
                "sku", "CLIN-" + marker,
                "price", 89.50,
                "stockQuantity", 9,
                "category", "PET_VETERINARY_SUPPLY",
                "unitOfMeasure", "DOSE",
                "minimumQuantity", 2,
                "reorderPoint", 6
        ), session);
        assertEquals(200, createProduct.getStatusCode().value());
        JsonNode createdProduct = requireBody(createProduct).path("data");
        String productId = createdProduct.path("id").asText();
        assertEquals("PET_VETERINARY_SUPPLY", createdProduct.path("category").asText());
        assertEquals("DOSE", createdProduct.path("unitOfMeasure").asText());
        assertEquals(9, createdProduct.path("currentQuantity").asInt());

        ResponseEntity<JsonNode> consumeSupply = post("/pet/inventory", Map.of(
                "productId", productId,
                "movementType", "OUT",
                "quantity", 3,
                "notes", "Clinical usage " + marker
        ), session);
        assertEquals(200, consumeSupply.getStatusCode().value());
        JsonNode movement = requireBody(consumeSupply).path("data");
        assertEquals("PET_CLINIC_CONSUMPTION", movement.path("sourceType").asText());
        assertEquals(9, movement.path("quantityBefore").asInt());
        assertEquals(6, movement.path("quantityAfter").asInt());

        ResponseEntity<JsonNode> productAfterConsumption = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterConsumption.getStatusCode().value());
        assertEquals(6, requireBody(productAfterConsumption).path("data").path("currentQuantity").asInt());
        assertEquals(6, requireBody(productAfterConsumption).path("data").path("stockQuantity").asInt());

        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM inventory_items WHERE tenant_id = ? AND sku = ? AND category = 'PET_VETERINARY_SUPPLY' AND deleted_at IS NULL",
                session.tenantId(),
                ("CLIN-" + marker).toUpperCase()
        ));
        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM inventory_movements WHERE tenant_id = ? AND source_type = 'PET_CLINIC_CONSUMPTION' AND source_reference_id = ? AND deleted_at IS NULL",
                session.tenantId(),
                productId
        ));
    }

    @Test
    void shouldRestoreDeletedInventoryMovementAndReapplyStockOnce() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createProduct = post("/pet/products", Map.of(
                "name", "Restore Product " + marker,
                "sku", "RESTORE-" + marker,
                "price", 15.0,
                "stockQuantity", 10
        ), session);
        assertEquals(200, createProduct.getStatusCode().value());
        String productId = requireBody(createProduct).path("data").path("id").asText();

        ResponseEntity<JsonNode> createInventory = post("/pet/inventory", Map.of(
                "productId", productId,
                "movementType", "IN",
                "quantity", 4,
                "notes", "Restore stock " + marker
        ), session);
        assertEquals(200, createInventory.getStatusCode().value());
        String inventoryId = requireBody(createInventory).path("data").path("id").asText();

        ResponseEntity<JsonNode> deleteInventory = delete("/pet/inventory/" + inventoryId, session);
        assertEquals(200, deleteInventory.getStatusCode().value());

        ResponseEntity<JsonNode> restoreInventory = patch("/pet/inventory/" + inventoryId + "/restore", null, session);
        assertEquals(200, restoreInventory.getStatusCode().value());
        assertEquals(inventoryId, requireBody(restoreInventory).path("data").path("id").asText());

        ResponseEntity<JsonNode> productAfterRestore = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterRestore.getStatusCode().value());
        assertEquals(14, requireBody(productAfterRestore).path("data").path("stockQuantity").asInt());

        int activeCount = countRows(
                "SELECT COUNT(*) FROM inventory_movements WHERE id = ? AND deleted_at IS NULL",
                inventoryId
        );
        assertEquals(1, activeCount);
    }

    @Test
    void shouldRejectRestoringActiveInventoryMovementWithoutChangingStock() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createProduct = post("/pet/products", Map.of(
                "name", "Conflict Product " + marker,
                "sku", "CONFLICT-" + marker,
                "price", 21.0,
                "stockQuantity", 8
        ), session);
        assertEquals(200, createProduct.getStatusCode().value());
        String productId = requireBody(createProduct).path("data").path("id").asText();

        ResponseEntity<JsonNode> createInventory = post("/pet/inventory", Map.of(
                "productId", productId,
                "movementType", "IN",
                "quantity", 3,
                "notes", "Active restore " + marker
        ), session);
        assertEquals(200, createInventory.getStatusCode().value());
        String inventoryId = requireBody(createInventory).path("data").path("id").asText();

        ResponseEntity<JsonNode> restoreActiveInventory = patch("/pet/inventory/" + inventoryId + "/restore", null, session);
        assertEquals(409, restoreActiveInventory.getStatusCode().value());
        assertEquals("CONFLICT", requireBody(restoreActiveInventory).path("code").asText());

        ResponseEntity<JsonNode> productAfterRejectedRestore = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterRejectedRestore.getStatusCode().value());
        assertEquals(11, requireBody(productAfterRejectedRestore).path("data").path("stockQuantity").asInt());
    }

    @Test
    void shouldRejectLegacyAppointmentWithoutRequiredProfessionalReference() {
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
                "notes", "Legacy integrity " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());
        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();

        executeSql("UPDATE pet_appointments SET professional_id = NULL WHERE id = ?", appointmentId);

        ResponseEntity<JsonNode> getAppointment = get("/pet/appointments/" + appointmentId, session);
        assertEquals(409, getAppointment.getStatusCode().value());
        assertEquals("CONFLICT", requireBody(getAppointment).path("code").asText());

        ResponseEntity<JsonNode> listAppointments = get(
                "/pet/appointments?page=0&size=20&search=" + marker,
                session
        );
        assertEquals(409, listAppointments.getStatusCode().value());
        assertEquals("CONFLICT", requireBody(listAppointments).path("code").asText());
    }

    @Test
    void shouldReturnPetDashboardSummary() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String serviceId = createService(session, marker);
        String professionalId = createProfessional(session, marker);
        Instant appointmentToday = LocalDate.now(ZoneOffset.UTC).atTime(12, 0).toInstant(ZoneOffset.UTC);
        Instant appointmentFuture = LocalDate.now(ZoneOffset.UTC).plusDays(1).atTime(9, 0).toInstant(ZoneOffset.UTC);

        ResponseEntity<JsonNode> createAppointmentToday = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", appointmentToday.toString(),
                "status", "SCHEDULED",
                "notes", "Dashboard appointment today " + marker
        ), session);
        assertEquals(200, createAppointmentToday.getStatusCode().value());

        ResponseEntity<JsonNode> createAppointmentFuture = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", appointmentFuture.toString(),
                "status", "SCHEDULED",
                "notes", "Dashboard appointment future " + marker
        ), session);
        assertEquals(200, createAppointmentFuture.getStatusCode().value());

        ResponseEntity<JsonNode> createMedicalRecord = post("/pet/medical-records", Map.of(
                "petId", petId,
                "professionalId", professionalId,
                "description", "Dashboard record " + marker,
                "diagnosis", "Diagnosis " + marker,
                "treatment", "Treatment " + marker
        ), session);
        assertEquals(200, createMedicalRecord.getStatusCode().value());

        ResponseEntity<JsonNode> createLowStockProduct = post("/pet/products", Map.of(
                "name", "Low Stock " + marker,
                "sku", "LOW-" + marker,
                "price", 10.0,
                "stockQuantity", 3
        ), session);
        assertEquals(200, createLowStockProduct.getStatusCode().value());

        ResponseEntity<JsonNode> createPendingInvoice = post("/pet/invoices", Map.of(
                "clientId", clientId,
                "totalAmount", 55.0,
                "status", "ISSUED",
                "issuedAt", Instant.now().toString()
        ), session);
        assertEquals(200, createPendingInvoice.getStatusCode().value());

        ResponseEntity<JsonNode> response = get("/pet/dashboard/summary", session);
        assertEquals(200, response.getStatusCode().value());

        JsonNode data = requireBody(response).path("data");
        assertTrue(data.path("totalClients").asInt() >= 1);
        assertTrue(data.path("totalPets").asInt() >= 1);
        assertTrue(data.path("appointmentsToday").asInt() >= 1);
        assertTrue(data.path("upcomingAppointments").asInt() >= 1);
        assertTrue(data.path("totalServices").asInt() >= 1);
        assertTrue(data.path("lowStockProducts").asInt() >= 1);
        assertTrue(data.path("pendingInvoices").asInt() >= 1);
        assertTrue(data.path("summaryCards").size() >= 7);
        assertTrue(data.path("sections").size() >= 2);
        assertTrue(data.path("sections").get(0).path("items").size() >= 1);
        assertTrue(data.path("sections").get(1).path("items").size() >= 1);
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

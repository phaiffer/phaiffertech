package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
                "documentType", "RG",
                "document", "DOC-" + marker,
                "address", "Street " + marker,
                "status", "ACTIVE"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("RG", requireBody(createResponse).path("data").path("documentType").asText());
        String clientId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get("/pet/clients?page=0&size=20&search=" + marker, session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/pet/clients/" + clientId, Map.of(
                "name", "Updated Client " + marker,
                "email", "updated.pet." + marker + "@example.test",
                "phone", "+5511888888888",
                "documentType", "CPF",
                "document", "529.982.247-25",
                "address", "Avenue " + marker,
                "status", "INACTIVE"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("INACTIVE", requireBody(updateResponse).path("data").path("status").asText());
        assertEquals("CPF", requireBody(updateResponse).path("data").path("documentType").asText());
        assertEquals("52998224725", requireBody(updateResponse).path("data").path("document").asText());

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
    void shouldRejectInvalidCpfForClientRegistration() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> response = post("/pet/clients", Map.of(
                "name", "Client Invalid CPF",
                "documentType", "CPF",
                "document", "111.111.111-11",
                "status", "ACTIVE"
        ), session);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("BAD_REQUEST", requireBody(response).path("code").asText());
        assertTrue(requireBody(response).path("message").asText().contains("CPF"));
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
        // Phase 24B: verify service price snapshot was captured from the service catalog at booking time.
        assertEquals(89.90, requireBody(createAppointment).path("data").path("servicePrice").asDouble(), 0.01);

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
    void shouldCreateAndFilterMultiServiceAppointment() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String bathServiceId = createService(session, marker + "-bath", "GROOMING");
        String hydrationServiceId = createService(session, marker + "-hydration", "GROOMING");
        String professionalId = createProfessional(session, marker);

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", bathServiceId,
                "serviceIds", List.of(bathServiceId, hydrationServiceId),
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "SCHEDULED",
                "notes", "Bundle appointment"
        ), session);

        assertEquals(200, createAppointment.getStatusCode().value());
        JsonNode createdAppointment = requireBody(createAppointment).path("data");
        assertEquals(bathServiceId, createdAppointment.path("serviceId").asText());
        assertEquals(2, createdAppointment.path("serviceCount").asInt());
        assertEquals(2, createdAppointment.path("appointmentServices").size());
        assertEquals("Service " + marker + "-bath + 1 more", createdAppointment.path("serviceName").asText());
        assertEquals(179.80, createdAppointment.path("totalServiceBasePrice").asDouble(), 0.01);
        assertEquals(80, createdAppointment.path("totalServiceDurationMinutes").asInt());

        ResponseEntity<JsonNode> filteredBySecondaryService = get(
                "/pet/appointments?page=0&size=20&serviceId=" + hydrationServiceId + "&search=hydration",
                session
        );
        assertEquals(200, filteredBySecondaryService.getStatusCode().value());
        assertEquals(1, requireBody(filteredBySecondaryService).path("data").path("items").size());
        assertEquals(2, requireBody(filteredBySecondaryService)
                .path("data")
                .path("items")
                .get(0)
                .path("appointmentServices")
                .size());
    }

    @Test
    void shouldAssignDifferentProfessionalsPerAppointmentServiceLine() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String bathServiceId = createService(session, marker + "-bath", "GROOMING", true, 80.00);
        String hygienicServiceId = createService(session, marker + "-hygienic", "GROOMING", true, 50.00);
        String bathProfessionalId = createProfessional(session, marker + "-bath", 0.15);
        String hygienicProfessionalId = createProfessional(session, marker + "-hygienic", 0.10);

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", bathServiceId,
                "serviceIds", List.of(bathServiceId, hygienicServiceId),
                "professionalId", bathProfessionalId,
                "serviceLineAssignments", List.of(
                        Map.of(
                                "serviceId", bathServiceId,
                                "professionalId", bathProfessionalId
                        ),
                        Map.of(
                                "serviceId", hygienicServiceId,
                                "professionalId", hygienicProfessionalId
                        )
                ),
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "SCHEDULED",
                "notes", "Split responsibility appointment"
        ), session);

        assertEquals(200, createAppointment.getStatusCode().value());
        JsonNode createdAppointment = requireBody(createAppointment).path("data");
        assertEquals(bathProfessionalId, createdAppointment.path("professionalId").asText());
        assertEquals("Professional " + marker + "-bath", createdAppointment.path("professionalName").asText());
        assertEquals(17.00, createdAppointment.path("commissionAmount").asDouble(), 0.01);

        JsonNode firstLine = createdAppointment.path("appointmentServices").get(0);
        assertEquals(bathProfessionalId, firstLine.path("professionalId").asText());
        assertEquals("Professional " + marker + "-bath", firstLine.path("professionalName").asText());
        assertEquals(12.00, firstLine.path("commissionAmount").asDouble(), 0.01);

        JsonNode secondLine = createdAppointment.path("appointmentServices").get(1);
        assertEquals(hygienicProfessionalId, secondLine.path("professionalId").asText());
        assertEquals("Professional " + marker + "-hygienic", secondLine.path("professionalName").asText());
        assertEquals(5.00, secondLine.path("commissionAmount").asDouble(), 0.01);

        ResponseEntity<JsonNode> filteredBySecondaryProfessional = get(
                "/pet/appointments?page=0&size=20&professionalId=" + hygienicProfessionalId + "&search=hygienic",
                session
        );
        assertEquals(200, filteredBySecondaryProfessional.getStatusCode().value());
        assertEquals(1, requireBody(filteredBySecondaryProfessional).path("data").path("items").size());
        assertEquals(
                hygienicProfessionalId,
                requireBody(filteredBySecondaryProfessional)
                        .path("data")
                        .path("items")
                        .get(0)
                        .path("appointmentServices")
                        .get(1)
                        .path("professionalId")
                        .asText()
        );
    }

    @Test
    void shouldTrackCommissionPerEligibleAppointmentServiceLine() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String groomingServiceId = createService(session, marker + "-grooming", "GROOMING", true, 80.00);
        String vaccinationServiceId = createService(session, marker + "-vaccination", "CLINICAL", false, 50.00);
        String professionalId = createProfessional(session, marker, 0.15);

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", groomingServiceId,
                "serviceIds", List.of(groomingServiceId, vaccinationServiceId),
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "SCHEDULED",
                "notes", "Mixed commission appointment"
        ), session);

        assertEquals(200, createAppointment.getStatusCode().value());
        JsonNode createdAppointment = requireBody(createAppointment).path("data");
        assertEquals(12.00, createdAppointment.path("commissionAmount").asDouble(), 0.01);
        assertEquals(2, createdAppointment.path("appointmentServices").size());

        JsonNode firstLine = createdAppointment.path("appointmentServices").get(0);
        assertEquals(true, firstLine.path("commissionEligible").asBoolean());
        assertEquals(0.15, firstLine.path("commissionRate").asDouble(), 0.0001);
        assertEquals(12.00, firstLine.path("commissionAmount").asDouble(), 0.01);

        JsonNode secondLine = createdAppointment.path("appointmentServices").get(1);
        assertEquals(false, secondLine.path("commissionEligible").asBoolean());
        assertTrue(secondLine.path("commissionRate").isMissingNode() || secondLine.path("commissionRate").isNull());
        assertTrue(secondLine.path("commissionAmount").isMissingNode() || secondLine.path("commissionAmount").isNull());
    }

    @Test
    void shouldSummarizeCommissionByResponsibleProfessional() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String bathServiceId = createService(session, marker + "-bath", "GROOMING", true, 80.00);
        String hygienicServiceId = createService(session, marker + "-hygienic", "GROOMING", true, 50.00);
        String vaccinationServiceId = createService(session, marker + "-vaccination", "CLINICAL", false, 35.00);
        String bathProfessionalId = createProfessional(session, marker + "-bath", 0.15);
        String hygienicProfessionalId = createProfessional(session, marker + "-hygienic", 0.10);
        String pendingProfessionalId = createProfessional(session, marker + "-pending");

        ResponseEntity<JsonNode> splitAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", bathServiceId,
                "serviceIds", List.of(bathServiceId, hygienicServiceId),
                "professionalId", bathProfessionalId,
                "serviceLineAssignments", List.of(
                        Map.of("serviceId", bathServiceId, "professionalId", bathProfessionalId),
                        Map.of("serviceId", hygienicServiceId, "professionalId", hygienicProfessionalId)
                ),
                "scheduledAt", Instant.parse("2026-02-10T13:00:00Z").toString(),
                "status", "COMPLETED",
                "notes", "Split professional attribution"
        ), session);
        assertEquals(200, splitAppointment.getStatusCode().value());

        ResponseEntity<JsonNode> mixedAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", bathServiceId,
                "serviceIds", List.of(bathServiceId, vaccinationServiceId),
                "professionalId", bathProfessionalId,
                "scheduledAt", Instant.parse("2026-02-12T13:00:00Z").toString(),
                "status", "COMPLETED",
                "notes", "Generated and excluded lines"
        ), session);
        assertEquals(200, mixedAppointment.getStatusCode().value());

        ResponseEntity<JsonNode> pendingAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", bathServiceId,
                "professionalId", pendingProfessionalId,
                "scheduledAt", Instant.parse("2026-02-14T13:00:00Z").toString(),
                "status", "COMPLETED",
                "notes", "Eligible line without commission rate"
        ), session);
        assertEquals(200, pendingAppointment.getStatusCode().value());

        ResponseEntity<JsonNode> legacyCompatibleAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", bathServiceId,
                "professionalId", bathProfessionalId,
                "scheduledAt", Instant.parse("2026-02-16T13:00:00Z").toString(),
                "status", "COMPLETED",
                "notes", "Historical single-line compatibility"
        ), session);
        assertEquals(200, legacyCompatibleAppointment.getStatusCode().value());
        String legacyCompatibleAppointmentId = requireBody(legacyCompatibleAppointment).path("data").path("id").asText();
        executeSql("DELETE FROM pet_appointment_services WHERE appointment_id = ?", legacyCompatibleAppointmentId);

        ResponseEntity<JsonNode> summaryResponse = get(
                "/pet/commissions/summary?scheduledFrom=2026-02-01T00:00:00Z&scheduledTo=2026-02-28T23:59:59Z",
                session
        );
        assertEquals(200, summaryResponse.getStatusCode().value());

        JsonNode data = requireBody(summaryResponse).path("data");
        assertEquals(41.00, data.path("totalCommissionAmount").asDouble(), 0.01);
        assertEquals(3, data.path("professionalCount").asInt());
        assertEquals(4, data.path("generatedLineCount").asInt());
        assertEquals(1, data.path("excludedLineCount").asInt());
        assertEquals(1, data.path("eligibleWithoutAmountLineCount").asInt());
        assertEquals(0, data.path("unassignedLineCount").asInt());
        assertEquals(0, data.path("legacyLineCount").asInt());
        assertEquals(3, data.path("contributingAppointmentCount").asInt());

        JsonNode professionals = data.path("professionals");
        JsonNode bathProfessionalSummary = findNodeByField(professionals, "professionalId", bathProfessionalId);
        assertEquals(36.00, bathProfessionalSummary.path("totalCommissionAmount").asDouble(), 0.01);
        assertEquals(3, bathProfessionalSummary.path("generatedLineCount").asInt());
        assertEquals(1, bathProfessionalSummary.path("excludedLineCount").asInt());
        assertEquals(0, bathProfessionalSummary.path("eligibleWithoutAmountLineCount").asInt());
        assertEquals(3, bathProfessionalSummary.path("contributingAppointmentCount").asInt());

        JsonNode hygienicProfessionalSummary = findNodeByField(professionals, "professionalId", hygienicProfessionalId);
        assertEquals(5.00, hygienicProfessionalSummary.path("totalCommissionAmount").asDouble(), 0.01);
        assertEquals(1, hygienicProfessionalSummary.path("generatedLineCount").asInt());
        assertEquals(0, hygienicProfessionalSummary.path("excludedLineCount").asInt());
        assertEquals(1, hygienicProfessionalSummary.path("contributingAppointmentCount").asInt());

        JsonNode pendingProfessionalSummary = findNodeByField(professionals, "professionalId", pendingProfessionalId);
        assertEquals(0.00, pendingProfessionalSummary.path("totalCommissionAmount").asDouble(), 0.01);
        assertEquals(0, pendingProfessionalSummary.path("generatedLineCount").asInt());
        assertEquals(1, pendingProfessionalSummary.path("eligibleWithoutAmountLineCount").asInt());

        JsonNode compatibilityDetail = findNodeByField(data.path("details"), "appointmentId", legacyCompatibleAppointmentId);
        assertEquals("GENERATED", compatibilityDetail.path("lineStatus").asText());
        assertEquals("COMPATIBILITY_FALLBACK", compatibilityDetail.path("dataSource").asText());
        assertEquals(bathProfessionalId, compatibilityDetail.path("professionalId").asText());
        assertEquals(12.00, compatibilityDetail.path("commissionAmount").asDouble(), 0.01);
    }

    @Test
    void shouldCreateUpdateAndDeleteServiceCatalog() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Description " + marker,
                "category", "CLINICAL",
                "active", true,
                "basePrice", 95.50,
                "durationMinutes", 45,
                "commissionEligible", true,
                "allowInPlans", true,
                "allowStandaloneBooking", true
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        assertEquals("CLINICAL", requireBody(createResponse).path("data").path("category").asText());
        assertTrue(requireBody(createResponse).path("data").path("active").asBoolean());
        String serviceId = requireBody(createResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> listResponse = get("/pet/services?page=0&size=20&search=" + marker + "&category=CLINICAL&active=true", session);
        assertEquals(200, listResponse.getStatusCode().value());
        assertTrue(requireBody(listResponse).path("data").path("items").size() >= 1);

        ResponseEntity<JsonNode> updateResponse = put("/pet/services/" + serviceId, Map.of(
                "name", "Service Updated " + marker,
                "description", "Updated " + marker,
                "category", "CLINICAL",
                "active", false,
                "basePrice", 120.00,
                "durationMinutes", 60,
                "commissionEligible", false,
                "allowInPlans", false,
                "allowStandaloneBooking", true
        ), session);
        assertEquals(200, updateResponse.getStatusCode().value());
        assertEquals("Service Updated " + marker, requireBody(updateResponse).path("data").path("name").asText());
        assertEquals("CLINICAL", requireBody(updateResponse).path("data").path("category").asText());
        assertEquals(false, requireBody(updateResponse).path("data").path("active").asBoolean());
        assertEquals(false, requireBody(updateResponse).path("data").path("commissionEligible").asBoolean());

        ResponseEntity<JsonNode> deleteResponse = delete("/pet/services/" + serviceId, session);
        assertEquals(200, deleteResponse.getStatusCode().value());
    }

    @Test
    void shouldRejectActiveServiceWithoutAnySchedulingPath() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        ResponseEntity<JsonNode> createResponse = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Description " + marker,
                "category", "GROOMING",
                "active", true,
                "basePrice", 55.00,
                "durationMinutes", 30,
                "commissionEligible", true,
                "allowInPlans", false,
                "allowStandaloneBooking", false
        ), session);

        assertEquals(409, createResponse.getStatusCode().value());
        assertTrue(requireBody(createResponse).path("message").asText().contains("standalone booking or plan-based scheduling"));
    }

    @Test
    void shouldKeepExistingAppointmentsEditableWhenServiceBecomesInactive() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String serviceId = createService(session, marker, "GROOMING");
        String professionalId = createProfessional(session, marker);

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(1800).toString(),
                "status", "SCHEDULED",
                "notes", "Before deactivation"
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());
        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();

        ResponseEntity<JsonNode> deactivateService = put("/pet/services/" + serviceId, Map.of(
                "name", "Service " + marker,
                "description", "Routine " + marker,
                "category", "GROOMING",
                "active", false,
                "basePrice", 89.90,
                "durationMinutes", 40,
                "commissionEligible", true,
                "allowInPlans", true,
                "allowStandaloneBooking", true
        ), session);
        assertEquals(200, deactivateService.getStatusCode().value());

        ResponseEntity<JsonNode> updateAppointment = put("/pet/appointments/" + appointmentId, Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "COMPLETED",
                "notes", "Historical service remains compatible"
        ), session);
        assertEquals(200, updateAppointment.getStatusCode().value());
        assertEquals("COMPLETED", requireBody(updateAppointment).path("data").path("status").asText());

        ResponseEntity<JsonNode> newAppointmentWithInactiveService = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(7200).toString(),
                "status", "SCHEDULED",
                "notes", "Should be rejected"
        ), session);
        assertEquals(409, newAppointmentWithInactiveService.getStatusCode().value());
        assertTrue(requireBody(newAppointmentWithInactiveService).path("message").asText().contains("inactive"));
    }

    @Test
    void shouldExposeServiceInventoryRecipeAndSnapshotItOnAppointmentLines() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String professionalId = createProfessional(session, marker);
        JsonNode shampooProduct = createProduct(session, marker + "-shampoo", "PET_RETAIL_GOOD");
        JsonNode towelProduct = createProduct(session, marker + "-towel", "PET_RETAIL_GOOD");

        String shampooInventoryItemId = shampooProduct.path("inventoryItemId").asText();
        String towelInventoryItemId = towelProduct.path("inventoryItemId").asText();

        ResponseEntity<JsonNode> createService = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Structured stock preview " + marker,
                "category", "GROOMING",
                "active", true,
                "basePrice", 92.50,
                "durationMinutes", 50,
                "commissionEligible", true,
                "allowInPlans", true,
                "allowStandaloneBooking", true,
                "inventoryLinks", List.of(
                        Map.of(
                                "inventoryItemId", shampooInventoryItemId,
                                "expectedQuantity", 1.50,
                                "consumptionRule", "FIXED_PER_SERVICE",
                                "active", true
                        ),
                        Map.of(
                                "inventoryItemId", towelInventoryItemId,
                                "expectedQuantity", 1.00,
                                "consumptionRule", "FIXED_PER_SERVICE",
                                "active", false
                        )
                )
        ), session);
        assertEquals(200, createService.getStatusCode().value());

        JsonNode createdService = requireBody(createService).path("data");
        assertEquals(2, createdService.path("inventoryLinks").size());
        JsonNode shampooLink = findNodeByField(createdService.path("inventoryLinks"), "inventoryItemId", shampooInventoryItemId);
        assertEquals("Product " + marker + "-shampoo", shampooLink.path("inventoryItemName").asText());
        assertEquals(1.50, shampooLink.path("expectedQuantity").asDouble(), 0.001);
        assertEquals(true, shampooLink.path("active").asBoolean());

        String serviceId = createdService.path("id").asText();

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "SCHEDULED",
                "notes", "Inventory recipe preview " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());

        JsonNode line = requireBody(createAppointment).path("data").path("appointmentServices").get(0);
        assertEquals(1, line.path("expectedInventoryConsumptions").size());
        assertEquals(
                shampooInventoryItemId,
                line.path("expectedInventoryConsumptions").get(0).path("inventoryItemId").asText()
        );
        assertEquals(
                "Product " + marker + "-shampoo",
                line.path("expectedInventoryConsumptions").get(0).path("inventoryItemName").asText()
        );
        assertEquals(1.50, line.path("expectedInventoryConsumptions").get(0).path("expectedQuantity").asDouble(), 0.001);
    }

    @Test
    void shouldFallbackToCurrentServiceInventoryRecipeWhenAppointmentLineSnapshotIsMissing() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String professionalId = createProfessional(session, marker);
        JsonNode supplyProduct = createProduct(session, marker + "-supply", "PET_VETERINARY_SUPPLY");
        String inventoryItemId = supplyProduct.path("inventoryItemId").asText();

        ResponseEntity<JsonNode> createService = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Fallback preview " + marker,
                "category", "CLINICAL",
                "active", true,
                "basePrice", 110.00,
                "durationMinutes", 45,
                "commissionEligible", false,
                "allowInPlans", true,
                "allowStandaloneBooking", true,
                "inventoryLinks", List.of(
                        Map.of(
                                "inventoryItemId", inventoryItemId,
                                "expectedQuantity", 1.00,
                                "consumptionRule", "FIXED_PER_SERVICE",
                                "active", true
                        )
                )
        ), session);
        assertEquals(200, createService.getStatusCode().value());
        String serviceId = requireBody(createService).path("data").path("id").asText();

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(5400).toString(),
                "status", "SCHEDULED",
                "notes", "Fallback recipe " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());

        String appointmentServiceLineId = requireBody(createAppointment)
                .path("data")
                .path("appointmentServices")
                .get(0)
                .path("id")
                .asText();

        executeSql("DELETE FROM pet_appointment_service_inventory WHERE appointment_service_id = ?", appointmentServiceLineId);

        ResponseEntity<JsonNode> getAppointment = get(
                "/pet/appointments/" + requireBody(createAppointment).path("data").path("id").asText(),
                session
        );
        assertEquals(200, getAppointment.getStatusCode().value());
        assertEquals(
                inventoryItemId,
                requireBody(getAppointment)
                        .path("data")
                        .path("appointmentServices")
                        .get(0)
                        .path("expectedInventoryConsumptions")
                        .get(0)
                        .path("inventoryItemId")
                        .asText()
        );
    }

    @Test
    void shouldCaptureActualInventoryConsumptionPerServiceLineWithoutCreatingStockMovements() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String professionalId = createProfessional(session, marker);
        JsonNode shampooProduct = createProduct(session, marker + "-actual", "PET_RETAIL_GOOD");
        String inventoryItemId = shampooProduct.path("inventoryItemId").asText();

        ResponseEntity<JsonNode> createService = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Actual consumption " + marker,
                "category", "GROOMING",
                "active", true,
                "basePrice", 90.00,
                "durationMinutes", 45,
                "commissionEligible", true,
                "allowInPlans", true,
                "allowStandaloneBooking", true,
                "inventoryLinks", List.of(
                        Map.of(
                                "inventoryItemId", inventoryItemId,
                                "expectedQuantity", 1.50,
                                "consumptionRule", "FIXED_PER_SERVICE",
                                "active", true
                        )
                )
        ), session);
        assertEquals(200, createService.getStatusCode().value());
        String serviceId = requireBody(createService).path("data").path("id").asText();

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "IN_PROGRESS",
                "notes", "Actual usage " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());

        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();
        String serviceLineId = requireBody(createAppointment)
                .path("data")
                .path("appointmentServices")
                .get(0)
                .path("id")
                .asText();

        int inventoryMovementCountBefore = countRows(
                "SELECT COUNT(*) FROM inventory_movements WHERE tenant_id = ? AND deleted_at IS NULL",
                session.tenantId()
        );

        ResponseEntity<JsonNode> updateActualConsumption = patch(
                "/pet/appointments/" + appointmentId + "/service-lines/" + serviceLineId + "/inventory-consumptions",
                Map.of(
                        "inventoryConsumptions", List.of(
                                Map.of(
                                        "inventoryItemId", inventoryItemId,
                                        "actualQuantity", 2.00,
                                        "consumptionStatus", "READY_TO_APPLY"
                                )
                        )
                ),
                session
        );
        assertEquals(200, updateActualConsumption.getStatusCode().value());
        JsonNode updatedLine = requireBody(updateActualConsumption)
                .path("data")
                .path("appointmentServices")
                .get(0);
        assertEquals(1.50, updatedLine.path("expectedInventoryConsumptions").get(0).path("expectedQuantity").asDouble(), 0.001);
        assertEquals(2.00, updatedLine.path("expectedInventoryConsumptions").get(0).path("actualQuantity").asDouble(), 0.001);
        assertEquals(
                "READY_TO_APPLY",
                updatedLine.path("expectedInventoryConsumptions").get(0).path("consumptionStatus").asText()
        );
        assertTrue(updatedLine.path("expectedInventoryConsumptions").get(0).path("snapshotBacked").asBoolean());
        assertFalse(updatedLine.path("expectedInventoryConsumptions").get(0).path("stockApplied").asBoolean());
        assertEquals("", updatedLine.path("expectedInventoryConsumptions").get(0).path("appliedInventoryMovementId").asText(""));

        assertEquals(
                inventoryMovementCountBefore,
                countRows(
                        "SELECT COUNT(*) FROM inventory_movements WHERE tenant_id = ? AND deleted_at IS NULL",
                        session.tenantId()
                )
        );

        ResponseEntity<JsonNode> completeAppointment = put("/pet/appointments/" + appointmentId, Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "COMPLETED",
                "notes", "Completed after actual usage " + marker
        ), session);
        assertEquals(200, completeAppointment.getStatusCode().value());
        assertEquals(
                1.50,
                requireBody(completeAppointment)
                        .path("data")
                        .path("appointmentServices")
                        .get(0)
                        .path("expectedInventoryConsumptions")
                        .get(0)
                        .path("expectedQuantity")
                        .asDouble(),
                0.001
        );
        assertEquals(
                2.00,
                requireBody(completeAppointment)
                        .path("data")
                        .path("appointmentServices")
                        .get(0)
                        .path("expectedInventoryConsumptions")
                        .get(0)
                        .path("actualQuantity")
                        .asDouble(),
                0.001
        );
        assertEquals(
                "READY_TO_APPLY",
                requireBody(completeAppointment)
                        .path("data")
                        .path("appointmentServices")
                        .get(0)
                        .path("expectedInventoryConsumptions")
                        .get(0)
                        .path("consumptionStatus")
                        .asText()
        );
        assertFalse(
                requireBody(completeAppointment)
                        .path("data")
                        .path("appointmentServices")
                        .get(0)
                        .path("expectedInventoryConsumptions")
                        .get(0)
                        .path("stockApplied")
                        .asBoolean()
        );
    }

    @Test
    void shouldApplyActualInventoryConsumptionToStockOncePerInventoryRow() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String professionalId = createProfessional(session, marker);
        JsonNode product = createProduct(session, marker + "-apply", "PET_RETAIL_GOOD");
        String productId = product.path("id").asText();
        String inventoryItemId = product.path("inventoryItemId").asText();

        ResponseEntity<JsonNode> createService = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Apply stock " + marker,
                "category", "GROOMING",
                "active", true,
                "basePrice", 95.00,
                "durationMinutes", 45,
                "commissionEligible", true,
                "allowInPlans", true,
                "allowStandaloneBooking", true,
                "inventoryLinks", List.of(
                        Map.of(
                                "inventoryItemId", inventoryItemId,
                                "expectedQuantity", 3.00,
                                "consumptionRule", "FIXED_PER_SERVICE",
                                "active", true
                        )
                )
        ), session);
        assertEquals(200, createService.getStatusCode().value());
        String serviceId = requireBody(createService).path("data").path("id").asText();

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "IN_PROGRESS",
                "notes", "Apply stock " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());

        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();
        String serviceLineId = requireBody(createAppointment)
                .path("data")
                .path("appointmentServices")
                .get(0)
                .path("id")
                .asText();

        ResponseEntity<JsonNode> updateActualConsumption = patch(
                "/pet/appointments/" + appointmentId + "/service-lines/" + serviceLineId + "/inventory-consumptions",
                Map.of(
                        "inventoryConsumptions", List.of(
                                Map.of(
                                        "inventoryItemId", inventoryItemId,
                                        "actualQuantity", 4.00,
                                        "consumptionStatus", "READY_TO_APPLY"
                                )
                        )
                ),
                session
        );
        assertEquals(200, updateActualConsumption.getStatusCode().value());

        JsonNode inventoryRow = requireBody(updateActualConsumption)
                .path("data")
                .path("appointmentServices")
                .get(0)
                .path("expectedInventoryConsumptions")
                .get(0);
        String inventoryRowId = inventoryRow.path("id").asText();
        assertFalse(inventoryRow.path("stockApplied").asBoolean());

        ResponseEntity<JsonNode> applyStock = post(
                "/pet/appointments/" + appointmentId
                        + "/service-lines/" + serviceLineId
                        + "/inventory-consumptions/" + inventoryRowId
                        + "/apply-stock",
                null,
                session
        );
        assertEquals(200, applyStock.getStatusCode().value());

        JsonNode appliedRow = requireBody(applyStock)
                .path("data")
                .path("appointmentServices")
                .get(0)
                .path("expectedInventoryConsumptions")
                .get(0);
        String movementId = appliedRow.path("appliedInventoryMovementId").asText();
        assertTrue(appliedRow.path("stockApplied").asBoolean());
        assertTrue(!movementId.isBlank());
        assertTrue(!appliedRow.path("stockAppliedAt").asText().isBlank());
        assertEquals(3.00, appliedRow.path("expectedQuantity").asDouble(), 0.001);
        assertEquals(4.00, appliedRow.path("actualQuantity").asDouble(), 0.001);
        assertEquals("READY_TO_APPLY", appliedRow.path("consumptionStatus").asText());

        ResponseEntity<JsonNode> productAfterApply = get("/pet/products/" + productId, session);
        assertEquals(200, productAfterApply.getStatusCode().value());
        assertEquals(16, requireBody(productAfterApply).path("data").path("stockQuantity").asInt());

        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM inventory_movements WHERE tenant_id = ? AND source_type = 'PET_APPOINTMENT_SERVICE_CONSUMPTION' AND source_reference_id = ? AND deleted_at IS NULL",
                session.tenantId(),
                inventoryRowId
        ));

        ResponseEntity<JsonNode> completeAppointment = put("/pet/appointments/" + appointmentId, Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "COMPLETED",
                "notes", "Completed after explicit stock application " + marker
        ), session);
        assertEquals(200, completeAppointment.getStatusCode().value());
        assertTrue(
                requireBody(completeAppointment)
                        .path("data")
                        .path("appointmentServices")
                        .get(0)
                        .path("expectedInventoryConsumptions")
                        .get(0)
                        .path("stockApplied")
                        .asBoolean()
        );
        assertEquals(
                movementId,
                requireBody(completeAppointment)
                        .path("data")
                        .path("appointmentServices")
                        .get(0)
                        .path("expectedInventoryConsumptions")
                        .get(0)
                        .path("appliedInventoryMovementId")
                        .asText()
        );
        assertEquals(16, requireBody(get("/pet/products/" + productId, session)).path("data").path("stockQuantity").asInt());
        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM inventory_movements WHERE tenant_id = ? AND source_type = 'PET_APPOINTMENT_SERVICE_CONSUMPTION' AND source_reference_id = ? AND deleted_at IS NULL",
                session.tenantId(),
                inventoryRowId
        ));

        ResponseEntity<JsonNode> reapplyStock = post(
                "/pet/appointments/" + appointmentId
                        + "/service-lines/" + serviceLineId
                        + "/inventory-consumptions/" + inventoryRowId
                        + "/apply-stock",
                null,
                session
        );
        assertEquals(200, reapplyStock.getStatusCode().value());
        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM inventory_movements WHERE tenant_id = ? AND source_type = 'PET_APPOINTMENT_SERVICE_CONSUMPTION' AND source_reference_id = ? AND deleted_at IS NULL",
                session.tenantId(),
                inventoryRowId
        ));
        assertEquals(16, requireBody(get("/pet/products/" + productId, session)).path("data").path("stockQuantity").asInt());
    }

    @Test
    void shouldFailSafelyWhenApplyingInventoryConsumptionWithoutEnoughStock() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();

        String clientId = createClient(session, marker);
        String petId = createPet(session, clientId, marker);
        String professionalId = createProfessional(session, marker);

        ResponseEntity<JsonNode> createProduct = post("/pet/products", Map.of(
                "name", "Low Stock " + marker,
                "sku", "LOW-" + marker,
                "price", 12.00,
                "stockQuantity", 2,
                "category", "PET_VETERINARY_SUPPLY",
                "unitOfMeasure", "DOSE",
                "minimumQuantity", 0,
                "reorderPoint", 1
        ), session);
        assertEquals(200, createProduct.getStatusCode().value());
        String productId = requireBody(createProduct).path("data").path("id").asText();
        String inventoryItemId = requireBody(createProduct).path("data").path("inventoryItemId").asText();

        ResponseEntity<JsonNode> createService = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Low stock apply " + marker,
                "category", "CLINICAL",
                "active", true,
                "basePrice", 120.00,
                "durationMinutes", 30,
                "commissionEligible", false,
                "allowInPlans", true,
                "allowStandaloneBooking", true,
                "inventoryLinks", List.of(
                        Map.of(
                                "inventoryItemId", inventoryItemId,
                                "expectedQuantity", 1.00,
                                "consumptionRule", "FIXED_PER_SERVICE",
                                "active", true
                        )
                )
        ), session);
        assertEquals(200, createService.getStatusCode().value());
        String serviceId = requireBody(createService).path("data").path("id").asText();

        ResponseEntity<JsonNode> createAppointment = post("/pet/appointments", Map.of(
                "clientId", clientId,
                "petId", petId,
                "serviceId", serviceId,
                "professionalId", professionalId,
                "scheduledAt", Instant.now().plusSeconds(3600).toString(),
                "status", "IN_PROGRESS",
                "notes", "Insufficient stock " + marker
        ), session);
        assertEquals(200, createAppointment.getStatusCode().value());

        String appointmentId = requireBody(createAppointment).path("data").path("id").asText();
        String serviceLineId = requireBody(createAppointment)
                .path("data")
                .path("appointmentServices")
                .get(0)
                .path("id")
                .asText();

        ResponseEntity<JsonNode> updateActualConsumption = patch(
                "/pet/appointments/" + appointmentId + "/service-lines/" + serviceLineId + "/inventory-consumptions",
                Map.of(
                        "inventoryConsumptions", List.of(
                                Map.of(
                                        "inventoryItemId", inventoryItemId,
                                        "actualQuantity", 3.00,
                                        "consumptionStatus", "READY_TO_APPLY"
                                )
                        )
                ),
                session
        );
        assertEquals(200, updateActualConsumption.getStatusCode().value());

        String inventoryRowId = requireBody(updateActualConsumption)
                .path("data")
                .path("appointmentServices")
                .get(0)
                .path("expectedInventoryConsumptions")
                .get(0)
                .path("id")
                .asText();

        ResponseEntity<JsonNode> applyStock = post(
                "/pet/appointments/" + appointmentId
                        + "/service-lines/" + serviceLineId
                        + "/inventory-consumptions/" + inventoryRowId
                        + "/apply-stock",
                null,
                session
        );
        assertEquals(409, applyStock.getStatusCode().value());
        assertEquals("CONFLICT", requireBody(applyStock).path("code").asText());
        assertTrue(requireBody(applyStock).path("message").asText().contains("Insufficient stock"));

        assertEquals(0, countRows(
                "SELECT COUNT(*) FROM inventory_movements WHERE tenant_id = ? AND source_type = 'PET_APPOINTMENT_SERVICE_CONSUMPTION' AND source_reference_id = ? AND deleted_at IS NULL",
                session.tenantId(),
                inventoryRowId
        ));
        assertEquals(2, requireBody(get("/pet/products/" + productId, session)).path("data").path("stockQuantity").asInt());
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
                "documentType", "RG",
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
        return createService(session, marker, "GROOMING");
    }

    private String createService(AuthSession session, String marker, String category) {
        return createService(session, marker, category, true, 89.90);
    }

    private String createService(
            AuthSession session,
            String marker,
            String category,
            boolean commissionEligible,
            double basePrice
    ) {
        ResponseEntity<JsonNode> createService = post("/pet/services", Map.of(
                "name", "Service " + marker,
                "description", "Routine " + marker,
                "category", category,
                "active", true,
                "basePrice", basePrice,
                "durationMinutes", 40,
                "commissionEligible", commissionEligible,
                "allowInPlans", true,
                "allowStandaloneBooking", true
        ), session);
        assertEquals(200, createService.getStatusCode().value());
        return requireBody(createService).path("data").path("id").asText();
    }

    private JsonNode createProduct(AuthSession session, String marker, String category) {
        ResponseEntity<JsonNode> createProduct = post("/pet/products", Map.of(
                "name", "Product " + marker,
                "sku", "SKU-" + marker,
                "price", 25.00,
                "stockQuantity", 20,
                "category", category,
                "unitOfMeasure", "UNIT",
                "minimumQuantity", 0,
                "reorderPoint", 5
        ), session);
        assertEquals(200, createProduct.getStatusCode().value());
        return requireBody(createProduct).path("data");
    }

    private String createProfessional(AuthSession session, String marker) {
        return createProfessional(session, marker, null);
    }

    private String createProfessional(AuthSession session, String marker, Double commissionRate) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", "Professional " + marker);
        payload.put("specialty", "Vet");
        payload.put("licenseNumber", "LIC-" + marker);
        payload.put("phone", "+5511888888888");
        payload.put("email", "professional." + marker + "@example.test");
        if (commissionRate != null) {
            payload.put("commissionRate", commissionRate);
        }

        ResponseEntity<JsonNode> createProfessional = post("/pet/professionals", payload, session);
        assertEquals(200, createProfessional.getStatusCode().value());
        return requireBody(createProfessional).path("data").path("id").asText();
    }

    private JsonNode findNodeByField(JsonNode nodes, String fieldName, String expectedValue) {
        for (JsonNode node : nodes) {
            if (expectedValue.equals(node.path(fieldName).asText())) {
                return node;
            }
        }

        throw new AssertionError("Node not found for " + fieldName + ": " + expectedValue);
    }
}

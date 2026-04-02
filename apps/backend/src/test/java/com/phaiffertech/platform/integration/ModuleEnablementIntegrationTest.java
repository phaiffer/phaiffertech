package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ModuleEnablementIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldBlockPetEndpointsWhenTenantModuleIsNotEnabled() {
        AuthSession session = createTenantAdminSession(
                "tenant-no-pet",
                "tenant-no-pet@example.test",
                "CORE_PLATFORM"
        );

        ResponseEntity<JsonNode> response = get("/pet/clients?page=0&size=20", session);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("MODULE_DISABLED", requireBody(response).path("code").asText());
    }

    @Test
    void shouldBlockIotEndpointsWhenFeatureFlagDisablesTheModule() {
        AuthSession session = createTenantAdminSession(
                "tenant-iot-flag-off",
                "tenant-iot-flag-off@example.test",
                "CORE_PLATFORM",
                "IOT"
        );

        upsertTenantFeatureFlag(session.tenantId(), "iot.enabled", false);

        ResponseEntity<JsonNode> response = get("/iot/dashboard/summary", session);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("MODULE_DISABLED", requireBody(response).path("code").asText());
    }

    @Test
    void shouldExposeSeparatedModuleStatusAndAggregateDashboardThroughCapabilities() {
        AuthSession session = createTenantAdminSession(
                "tenant-capabilities",
                "tenant-capabilities@example.test",
                "CORE_PLATFORM",
                "CRM",
                "PET"
        );

        upsertTenantFeatureFlag(session.tenantId(), "pet.enabled", false);

        ResponseEntity<JsonNode> registryResponse = get("/modules", session);
        assertEquals(200, registryResponse.getStatusCode().value());

        JsonNode modules = requireBody(registryResponse).path("data");
        JsonNode crm = findModule(modules, "CRM");
        JsonNode pet = findModule(modules, "PET");
        JsonNode iot = findModule(modules, "IOT");

        assertNotNull(crm);
        assertNotNull(pet);
        assertNotNull(iot);

        assertTrue(crm.path("moduleEnabled").asBoolean());
        assertTrue(crm.path("featureFlagEnabled").asBoolean());
        assertTrue(crm.path("available").asBoolean());
        assertTrue(crm.path("enabled").asBoolean());

        assertTrue(pet.path("moduleEnabled").asBoolean());
        assertFalse(pet.path("featureFlagEnabled").asBoolean());
        assertFalse(pet.path("available").asBoolean());
        assertFalse(pet.path("enabled").asBoolean());

        assertFalse(iot.path("moduleEnabled").asBoolean());
        assertTrue(iot.path("featureFlagEnabled").asBoolean());
        assertFalse(iot.path("available").asBoolean());

        ResponseEntity<JsonNode> dashboardResponse = get("/dashboard/summary", session);
        assertEquals(200, dashboardResponse.getStatusCode().value());

        JsonNode summaries = requireBody(dashboardResponse).path("data").path("modules");
        Set<String> moduleCodes = new HashSet<>();
        summaries.forEach(summary -> moduleCodes.add(summary.path("moduleCode").asText()));

        assertEquals(1, summaries.size());
        assertTrue(moduleCodes.contains("CRM"));
        assertFalse(moduleCodes.contains("PET"));
        assertFalse(moduleCodes.contains("IOT"));
        assertTrue(requireBody(dashboardResponse).path("data").path("coreSummary").path("cards").size() > 0);
        assertTrue(summaries.get(0).path("summaryCards").size() > 0);
        assertTrue(summaries.get(0).path("sections").size() > 0);
    }

    @Test
    void shouldHideModuleSectionsFromGlobalDashboardWhenUserLacksDashboardPermission() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-no-dashboard-permission",
                "tenant-no-dashboard-permission@example.test",
                List.of(),
                "CRM",
                "IOT",
                "PET"
        );

        ResponseEntity<JsonNode> response = get("/dashboard/summary", session);
        assertEquals(200, response.getStatusCode().value());

        JsonNode data = requireBody(response).path("data");
        assertTrue(data.path("coreSummary").path("cards").size() > 0);
        assertEquals(0, data.path("modules").size());
    }

    @Test
    void shouldBlockPetDashboardWhenPermissionIsMissingEvenIfModuleIsEnabled() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-pet-dashboard-blocked",
                "tenant-pet-dashboard-blocked@example.test",
                List.of("pet.client.read"),
                "PET"
        );

        ResponseEntity<JsonNode> response = get("/pet/dashboard/summary", session);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("FORBIDDEN", requireBody(response).path("code").asText());
    }

    @Test
    void shouldBlockIotDashboardWhenEntitlementIsMissingEvenIfModuleAndPermissionAreEnabled() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-iot-entitlement-blocked",
                "tenant-iot-entitlement-blocked@example.test",
                List.of("iot.dashboard.read"),
                "IOT"
        );

        executeSql(
                """
                UPDATE tenant_feature_entitlements
                SET enabled = FALSE
                WHERE tenant_id = ?
                  AND feature_key = 'iot.basic'
                """,
                session.tenantId()
        );

        ResponseEntity<JsonNode> response = get("/iot/dashboard/summary", session);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("FORBIDDEN", requireBody(response).path("code").asText());
        assertTrue(requireBody(response).path("message").asText().contains("iot.basic"));
    }

    @Test
    void shouldBlockVeterinaryPetEndpointsWhenTenantOnlyContractsAestheticsAndRetail() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-pet-vertical-segregation",
                "tenant-pet-vertical-segregation@example.test",
                List.of("pet.appointment.read", "pet.product.read", "pet.medical-record.read"),
                "PET"
        );

        executeSql(
                """
                UPDATE tenant_feature_entitlements
                SET enabled = FALSE
                WHERE tenant_id = ?
                  AND feature_key = 'pet.full'
                """,
                session.tenantId()
        );
        upsertTenantEntitlement(session.tenantId(), "pet.aesthetics", "MANUAL");
        upsertTenantEntitlement(session.tenantId(), "pet.retail", "MANUAL");

        ResponseEntity<JsonNode> appointmentResponse = get("/pet/appointments?page=0&size=20", session);
        ResponseEntity<JsonNode> productResponse = get("/pet/products?page=0&size=20", session);
        ResponseEntity<JsonNode> medicalRecordResponse = get("/pet/medical-records?page=0&size=20", session);

        assertEquals(200, appointmentResponse.getStatusCode().value());
        assertEquals(200, productResponse.getStatusCode().value());
        assertEquals(403, medicalRecordResponse.getStatusCode().value());
        assertEquals("FORBIDDEN", requireBody(medicalRecordResponse).path("code").asText());
        assertTrue(requireBody(medicalRecordResponse).path("message").asText().contains("pet.veterinary"));
    }

    @Test
    void shouldAllowBasicPetProfilesWithoutVeterinaryEntitlement() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-pet-profile-operational",
                "tenant-pet-profile-operational@example.test",
                List.of("pet.client.create", "pet.profile.create", "pet.profile.read", "pet.medical-record.read"),
                "PET"
        );

        executeSql(
                """
                UPDATE tenant_feature_entitlements
                SET enabled = FALSE
                WHERE tenant_id = ?
                  AND feature_key = 'pet.full'
                """,
                session.tenantId()
        );
        upsertTenantEntitlement(session.tenantId(), "pet.aesthetics", "MANUAL");
        upsertTenantEntitlement(session.tenantId(), "pet.retail", "MANUAL");

        ResponseEntity<JsonNode> clientResponse = post("/pet/clients", Map.of(
                "name", "Operational Owner",
                "documentType", "RG",
                "document", "OP-CLIENT-001",
                "status", "ACTIVE"
        ), session);
        assertEquals(200, clientResponse.getStatusCode().value());

        String clientId = requireBody(clientResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> createPetResponse = post("/pet/pets", Map.of(
                "clientId", clientId,
                "name", "Operational Pet",
                "species", "DOG"
        ), session);
        assertEquals(200, createPetResponse.getStatusCode().value());

        ResponseEntity<JsonNode> listProfilesResponse = get("/pet/pets?page=0&size=20", session);
        ResponseEntity<JsonNode> medicalRecordResponse = get("/pet/medical-records?page=0&size=20", session);

        assertEquals(200, listProfilesResponse.getStatusCode().value());
        assertEquals(403, medicalRecordResponse.getStatusCode().value());
        assertTrue(requireBody(medicalRecordResponse).path("message").asText().contains("pet.veterinary"));
    }

    @Test
    void shouldAllowLegacyPetBasicEntitlementToSatisfyPetSubmoduleChecks() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-pet-basic-compatibility",
                "tenant-pet-basic-compatibility@example.test",
                List.of("pet.medical-record.read"),
                "PET"
        );

        executeSql(
                """
                UPDATE tenant_feature_entitlements
                SET enabled = FALSE
                WHERE tenant_id = ?
                  AND feature_key = 'pet.full'
                """,
                session.tenantId()
        );
        upsertTenantEntitlement(session.tenantId(), "pet.basic", "MANUAL");

        ResponseEntity<JsonNode> response = get("/pet/medical-records?page=0&size=20", session);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void shouldAggregateRecentModuleActivityIntoExecutiveDashboardSummary() {
        AuthSession session = createTenantAdminSession(
                "tenant-executive-summary",
                "tenant-executive-summary@example.test",
                "CORE_PLATFORM",
                "CRM"
        );
        String marker = randomSearchMarker();
        String companyId = createCompany(session, marker);
        String stageId = defaultPipelineStageId(session);

        post("/crm/leads", Map.of(
                "name", "Lead " + marker,
                "status", "QUALIFIED",
                "source", "WEBSITE",
                "companyId", companyId
        ), session);

        post("/crm/deals", Map.of(
                "title", "Deal " + marker,
                "status", "OPEN",
                "companyId", companyId,
                "pipelineStageId", stageId,
                "currency", "BRL",
                "expectedCloseDate", LocalDate.now().plusDays(7).toString()
        ), session);

        post("/crm/tasks", Map.of(
                "title", "Overdue task " + marker,
                "status", "OPEN",
                "priority", "HIGH",
                "dueDate", Instant.now().minusSeconds(3600).toString(),
                "companyId", companyId
        ), session);

        ResponseEntity<JsonNode> response = get("/dashboard/summary", session);
        assertEquals(200, response.getStatusCode().value());

        JsonNode data = requireBody(response).path("data");
        JsonNode coreSummary = data.path("coreSummary");
        JsonNode summaries = data.path("modules");

        assertEquals(1, summaries.size());
        assertTrue(coreSummary.path("items").size() >= 1);
        assertTrue(findCard(coreSummary.path("cards"), "attention-signals").path("value").asLong() >= 1);
        assertTrue(findCard(coreSummary.path("cards"), "modules-needing-setup").path("value").asLong() == 0);
        assertTrue(summaries.get(0).path("sections").size() >= 2);
    }

    private JsonNode findModule(JsonNode modules, String code) {
        for (JsonNode module : modules) {
            if (code.equals(module.path("code").asText())) {
                return module;
            }
        }
        return null;
    }

    private JsonNode findCard(JsonNode cards, String key) {
        for (JsonNode card : cards) {
            if (key.equals(card.path("key").asText())) {
                return card;
            }
        }
        return null;
    }

    private String createCompany(AuthSession session, String marker) {
        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Executive Company " + marker,
                "document", "EXEC-" + marker,
                "status", "ACTIVE"
        ), session);
        return requireBody(response).path("data").path("id").asText();
    }

    private String defaultPipelineStageId(AuthSession session) {
        ResponseEntity<JsonNode> response = get("/crm/pipeline-stages?page=0&size=20", session);
        return requireBody(response).path("data").path("items").get(0).path("id").asText();
    }
}

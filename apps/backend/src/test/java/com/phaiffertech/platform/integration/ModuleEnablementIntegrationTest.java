package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
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

        assertNull(crm);
        assertNotNull(pet);

        assertTrue(pet.path("moduleEnabled").asBoolean());
        assertFalse(pet.path("featureFlagEnabled").asBoolean());
        assertFalse(pet.path("available").asBoolean());
        assertFalse(pet.path("enabled").asBoolean());

        ResponseEntity<JsonNode> crmDashboardResponse = get("/crm/dashboard/summary", session);
        assertEquals(200, crmDashboardResponse.getStatusCode().value());
        assertTrue(requireBody(crmDashboardResponse).path("data").path("summaryCards").size() > 0);

        ResponseEntity<JsonNode> dashboardResponse = get("/dashboard/summary", session);
        assertEquals(200, dashboardResponse.getStatusCode().value());

        JsonNode summaries = requireBody(dashboardResponse).path("data").path("modules");
        assertEquals(0, summaries.size());
        assertTrue(requireBody(dashboardResponse).path("data").path("coreSummary").path("cards").size() > 0);
    }

    @Test
    void shouldHideModuleSectionsFromGlobalDashboardWhenUserLacksDashboardPermission() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-no-dashboard-permission",
                "tenant-no-dashboard-permission@example.test",
                List.of(),
                "CRM",
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
    void shouldAllowAestheticsInvoicesWithPermissionWhileKeepingRetailAndClinicalEndpointsClosed() {
        String tenantCode = "tenant-grooming-invoices";
        String email = "tenant-grooming-invoices@example.test";
        AuthSession withoutInvoicePermission = createTenantSessionWithPermissions(
                tenantCode,
                email,
                List.of("pet.client.create", "pet.product.read", "pet.inventory.read", "pet.medical-record.read"),
                "PET"
        );
        disableFullPetEntitlement(withoutInvoicePermission);
        upsertTenantEntitlement(withoutInvoicePermission.tenantId(), "pet.aesthetics", "MANUAL");

        ResponseEntity<JsonNode> deniedInvoice = get("/pet/invoices?page=0&size=20", withoutInvoicePermission);
        assertEquals(403, deniedInvoice.getStatusCode().value());
        assertTrue(requireBody(deniedInvoice).path("message").asText().contains("pet.invoice.read"));

        executeSql(
                """
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT ut.role_id, p.id
                FROM user_tenants ut
                CROSS JOIN permissions p
                WHERE ut.tenant_id = ?
                  AND ut.user_id = ?
                  AND p.code IN ('pet.invoice.create', 'pet.invoice.read', 'pet.invoice.update')
                """,
                withoutInvoicePermission.tenantId(),
                withoutInvoicePermission.userId()
        );
        ResponseEntity<JsonNode> loginResponse = postPublic("/auth/login", Map.of(
                "tenantCode", tenantCode,
                "email", email,
                "password", "Admin@123"
        ));
        assertEquals(200, loginResponse.getStatusCode().value());
        AuthSession authorized = sessionFromLoginResponse(loginResponse);

        ResponseEntity<JsonNode> client = post("/pet/clients", Map.of(
                "name", "Grooming Invoice Owner",
                "documentType", "RG",
                "document", "GROOM-INVOICE-001",
                "status", "ACTIVE"
        ), authorized);
        assertEquals(200, client.getStatusCode().value());
        String clientId = requireBody(client).path("data").path("id").asText();

        ResponseEntity<JsonNode> createdInvoice = post("/pet/invoices", Map.of(
                "clientId", clientId,
                "totalAmount", 75.00
        ), authorized);
        assertEquals(200, createdInvoice.getStatusCode().value());
        String invoiceId = requireBody(createdInvoice).path("data").path("id").asText();
        assertEquals(200, get("/pet/invoices/" + invoiceId, authorized).getStatusCode().value());

        ResponseEntity<JsonNode> payment = post("/pet/invoices/" + invoiceId + "/payments", Map.of(
                "amount", 75.00,
                "method", "MANUAL"
        ), authorized);
        assertEquals(200, payment.getStatusCode().value());
        assertEquals("CONFIRMED", requireBody(payment).path("data").path("status").asText());
        assertEquals("PAID", requireBody(get("/pet/invoices/" + invoiceId, authorized))
                .path("data").path("status").asText());

        assertEquals(403, get("/pet/products?page=0&size=20", authorized).getStatusCode().value());
        assertEquals(403, get("/pet/inventory?page=0&size=20", authorized).getStatusCode().value());
        assertEquals(403, get("/pet/medical-records?page=0&size=20", authorized).getStatusCode().value());

        AuthSession otherTenant = createTenantSessionWithPermissions(
                "tenant-other-grooming-invoices",
                "tenant-other-grooming-invoices@example.test",
                List.of("pet.invoice.read"),
                "PET"
        );
        disableFullPetEntitlement(otherTenant);
        assertEquals(403, get("/pet/invoices?page=0&size=20", otherTenant).getStatusCode().value());
        upsertTenantEntitlement(otherTenant.tenantId(), "pet.aesthetics", "MANUAL");
        assertEquals(404, get("/pet/invoices/" + invoiceId, otherTenant).getStatusCode().value());
    }

    @Test
    void shouldKeepRetailOnlyInvoiceAccess() {
        AuthSession retail = createTenantSessionWithPermissions(
                "tenant-retail-invoices",
                "tenant-retail-invoices@example.test",
                List.of("pet.client.create", "pet.invoice.create", "pet.invoice.read"),
                "PET"
        );
        disableFullPetEntitlement(retail);
        upsertTenantEntitlement(retail.tenantId(), "pet.retail", "MANUAL");

        ResponseEntity<JsonNode> client = post("/pet/clients", Map.of(
                "name", "Retail Invoice Owner",
                "documentType", "RG",
                "document", "RETAIL-INVOICE-001",
                "status", "ACTIVE"
        ), retail);
        assertEquals(200, client.getStatusCode().value());

        ResponseEntity<JsonNode> invoice = post("/pet/invoices", Map.of(
                "clientId", requireBody(client).path("data").path("id").asText(),
                "totalAmount", 40.00
        ), retail);
        assertEquals(200, invoice.getStatusCode().value());
        String invoiceId = requireBody(invoice).path("data").path("id").asText();
        assertEquals(200, get("/pet/invoices/" + invoiceId, retail).getStatusCode().value());
    }

    private void disableFullPetEntitlement(AuthSession session) {
        executeSql(
                """
                UPDATE tenant_feature_entitlements
                SET enabled = FALSE
                WHERE tenant_id = ?
                  AND feature_key = 'pet.full'
                """,
                session.tenantId()
        );
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

        assertEquals(0, summaries.size());
        assertEquals(0, coreSummary.path("items").size());
        assertEquals(0, findCard(coreSummary.path("cards"), "attention-signals").path("value").asLong());
        assertEquals(0, findCard(coreSummary.path("cards"), "modules-needing-setup").path("value").asLong());

        ResponseEntity<JsonNode> crmDashboardResponse = get("/crm/dashboard/summary", session);
        assertEquals(200, crmDashboardResponse.getStatusCode().value());
        JsonNode crmSummary = requireBody(crmDashboardResponse).path("data");
        assertTrue(crmSummary.path("overdueTasks").asLong() >= 1);
        assertTrue(crmSummary.path("sections").size() >= 2);
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

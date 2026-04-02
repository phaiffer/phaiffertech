package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ActiveProfiles(profiles = {"test", "dev"}, inheritProfiles = false)
class LocalDevelopmentAdminAccessIntegrationTest extends AbstractIntegrationTest {

    @Test
    void localDevelopmentAdminCanLogInToAnExpiredTrialTenant() {
        loginAsDefaultAdmin();

        String tenantId = createTenant("local-dev-expired-trial", "TRIAL", LocalDate.now().minusDays(2));
        linkLocalDevelopmentAdminToTenant(tenantId);

        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "local-dev-expired-trial",
                "email", "admin@local.test",
                "password", "Admin@123"
        ));

        assertEquals(200, response.getStatusCode().value());
        assertTrue(containsValue(requireBody(response).path("data").path("user").path("featureEntitlements"), "*"));
    }

    @Test
    void localDevelopmentAdminKeepsFullModuleAndEntitlementAccessWhileImpersonating() {
        AuthSession platformAdmin = loginAsDefaultAdmin();
        String targetTenantId = createTenant("local-dev-restricted-tenant", "ACTIVE", null);

        ResponseEntity<JsonNode> startResponse = post("/auth/impersonation/start", Map.of(
                "targetTenantId", targetTenantId,
                "reason", "Validate unrestricted local development access",
                "durationMinutes", 15
        ), platformAdmin);

        assertEquals(200, startResponse.getStatusCode().value());
        JsonNode data = requireBody(startResponse).path("data");
        JsonNode user = data.path("user");
        assertTrue(containsValue(user.path("featureEntitlements"), "*"));

        AuthSession impersonatedSession = authSession(
                data.path("accessToken").asText(),
                platformAdmin.refreshCookie(),
                user.path("tenantId").asText(),
                user.path("userId").asText()
        );

        ResponseEntity<JsonNode> modulesResponse = get("/modules", impersonatedSession);
        assertEquals(200, modulesResponse.getStatusCode().value());

        JsonNode crmModule = findModule(requireBody(modulesResponse).path("data"), "CRM");
        assertTrue(crmModule.path("moduleEnabled").asBoolean());
        assertTrue(crmModule.path("featureFlagEnabled").asBoolean());
        assertTrue(crmModule.path("available").asBoolean());

        ResponseEntity<JsonNode> dashboardResponse = get("/crm/dashboard/summary", impersonatedSession);
        assertEquals(200, dashboardResponse.getStatusCode().value());

        ResponseEntity<JsonNode> stopResponse = post("/auth/impersonation/stop", null, impersonatedSession);
        assertEquals(200, stopResponse.getStatusCode().value());
    }

    @Test
    void localDevelopmentAdminKeepsPetProfileAccessEvenWithoutTenantEntitlements() {
        AuthSession platformAdmin = loginAsDefaultAdmin();
        String targetTenantId = createTenant("local-dev-pet-restricted", "ACTIVE", null);

        ResponseEntity<JsonNode> startResponse = post("/auth/impersonation/start", Map.of(
                "targetTenantId", targetTenantId,
                "reason", "Validate unrestricted PetFlow profile access in local development",
                "durationMinutes", 15
        ), platformAdmin);

        assertEquals(200, startResponse.getStatusCode().value());
        JsonNode data = requireBody(startResponse).path("data");
        JsonNode user = data.path("user");

        AuthSession impersonatedSession = authSession(
                data.path("accessToken").asText(),
                platformAdmin.refreshCookie(),
                user.path("tenantId").asText(),
                user.path("userId").asText()
        );

        ResponseEntity<JsonNode> clientResponse = post("/pet/clients", Map.of(
                "name", "Local Development Owner",
                "documentType", "RG",
                "document", "LOCAL-DEV-001",
                "status", "ACTIVE"
        ), impersonatedSession);

        assertEquals(200, clientResponse.getStatusCode().value());
        String clientId = requireBody(clientResponse).path("data").path("id").asText();

        ResponseEntity<JsonNode> petResponse = post("/pet/pets", Map.of(
                "clientId", clientId,
                "name", "Local Development Pet",
                "species", "DOG"
        ), impersonatedSession);

        assertEquals(200, petResponse.getStatusCode().value());

        ResponseEntity<JsonNode> stopResponse = post("/auth/impersonation/stop", null, impersonatedSession);
        assertEquals(200, stopResponse.getStatusCode().value());
    }

    @Test
    void nonExemptDevelopmentUsersRemainBoundToTenantModuleRestrictions() {
        AuthSession session = createTenantAdminSession(
                "local-dev-non-exempt",
                "operator@local.test",
                "CORE_PLATFORM"
        );

        ResponseEntity<JsonNode> modulesResponse = get("/modules", session);
        assertEquals(200, modulesResponse.getStatusCode().value());

        JsonNode crmModule = findModule(requireBody(modulesResponse).path("data"), "CRM");
        assertFalse(crmModule.path("moduleEnabled").asBoolean());
        assertFalse(crmModule.path("available").asBoolean());

        ResponseEntity<JsonNode> dashboardResponse = get("/crm/dashboard/summary", session);
        assertEquals(403, dashboardResponse.getStatusCode().value());
        assertEquals("MODULE_DISABLED", requireBody(dashboardResponse).path("code").asText());
    }

    private String createTenant(String tenantCode, String status, LocalDate trialEndDate) {
        String tenantId = UUID.randomUUID().toString();
        executeSql(
                "INSERT INTO tenants (id, name, code, status, plan_code, trial_end_date) VALUES (?, ?, ?, ?, 'PETSHOP', ?)",
                tenantId,
                "Tenant " + tenantCode,
                tenantCode,
                status,
                trialEndDate
        );
        return tenantId;
    }

    private void linkLocalDevelopmentAdminToTenant(String tenantId) {
        executeSql(
                """
                INSERT INTO user_tenants (id, tenant_id, user_id, role_id, active)
                SELECT ?, ?, u.id, r.id, TRUE
                FROM users u
                JOIN roles r ON r.code = 'PLATFORM_ADMIN'
                WHERE u.email = 'admin@local.test'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM user_tenants ut
                      WHERE ut.tenant_id = ?
                        AND ut.user_id = u.id
                  )
                """,
                UUID.randomUUID().toString(),
                tenantId,
                tenantId
        );
        executeSql(
                """
                INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at)
                SELECT ?, ut.id, r.id, NOW()
                FROM user_tenants ut
                JOIN users u ON ut.user_id = u.id
                JOIN roles r ON r.code = 'PLATFORM_ADMIN'
                WHERE ut.tenant_id = ?
                  AND u.email = 'admin@local.test'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM user_tenant_roles utr
                      WHERE utr.user_tenant_id = ut.id
                        AND utr.role_id = r.id
                  )
                """,
                UUID.randomUUID().toString(),
                tenantId
        );
    }

    private JsonNode findModule(JsonNode modules, String code) {
        for (JsonNode module : modules) {
            if (code.equals(module.path("code").asText())) {
                return module;
            }
        }
        throw new AssertionError("Module not found: " + code);
    }

    private boolean containsValue(JsonNode values, String expectedValue) {
        for (JsonNode value : values) {
            if (expectedValue.equals(value.asText())) {
                return true;
            }
        }
        return false;
    }
}

package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@TestPropertySource(properties = {
        "app.demo.assisted.enabled=true",
        "app.demo.assisted.tenant-code=demo-clinic",
        "app.demo.assisted.user-email=demo@phaiffer.tech",
        "app.demo.assisted.user-password=Admin@123",
        "app.demo.assisted.enforce-feature-flag=false"
})
class DemoLoginIntegrationTest extends AbstractIntegrationTest {

    private static final String DEFAULT_PASSWORD_HASH = "$2a$10$28RqVTDwgyR5J0XvjGFsUOhADXAU/xi/VX0fhlSoBv46MgMc3HDJi";

    @Test
    void demoLoginShouldAuthenticateConfiguredDemoAccount() {
        String tenantId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();
        String userTenantId = UUID.randomUUID().toString();

        executeSql(
                "INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, 'ACTIVE')",
                tenantId,
                "Demo Clinic",
                "demo-clinic"
        );
        executeSql(
                "INSERT INTO users (id, email, password_hash, full_name, active) VALUES (?, ?, ?, ?, TRUE)",
                userId,
                "demo@phaiffer.tech",
                DEFAULT_PASSWORD_HASH,
                "Demo User"
        );
        executeSql(
                """
                INSERT INTO user_tenants (id, tenant_id, user_id, role_id, active)
                SELECT ?, ?, ?, r.id, TRUE
                FROM roles r
                WHERE r.code = 'TENANT_ADMIN'
                """,
                userTenantId,
                tenantId,
                userId
        );
        executeSql(
                """
                INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at)
                SELECT ?, ?, r.id, NOW()
                FROM roles r
                WHERE r.code = 'TENANT_ADMIN'
                """,
                UUID.randomUUID().toString(),
                userTenantId
        );
        enableTenantModules(tenantId, "CORE_PLATFORM", "CRM", "PET", "IOT");

        ResponseEntity<JsonNode> response = postPublic("/auth/demo-login", Map.of());

        assertEquals(200, response.getStatusCode().value());
        JsonNode data = requireBody(response).path("data");
        assertEquals("demo-clinic", data.path("user").path("tenantCode").asText());
        assertEquals("demo@phaiffer.tech", data.path("user").path("email").asText());
        assertTrue(data.path("accessToken").asText().length() > 20);
        assertTrue(requireSetCookieHeader(response).startsWith("platform_refresh_token="));
    }
}

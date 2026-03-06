package com.phaiffertech.platform.integration;

import com.phaiffertech.platform.support.AbstractIntegrationTest;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TenantRoleResolutionIntegrationTest extends AbstractIntegrationTest {

    private static final String DEFAULT_TENANT_ID = "11111111-1111-1111-1111-111111111111";
    private static final String DEFAULT_USER_TENANT_ID = "33333333-3333-3333-3333-333333333333";
    private static final String TENANT_ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000003";
    private static final String VIEWER_ROLE_ID = "00000000-0000-0000-0000-000000000006";
    private static final String DEV_PASSWORD_HASH = "$2a$10$28RqVTDwgyR5J0XvjGFsUOhADXAU/xi/VX0fhlSoBv46MgMc3HDJi";

    @Test
    void loginShouldResolveRolesFromUserTenantRoleModel() {
        executeSql("""
                INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at)
                SELECT ?, ?, ?, NOW()
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM user_tenant_roles
                    WHERE user_tenant_id = ?
                      AND role_id = ?
                )
                """,
                UUID.randomUUID().toString(),
                DEFAULT_USER_TENANT_ID,
                TENANT_ADMIN_ROLE_ID,
                DEFAULT_USER_TENANT_ID,
                TENANT_ADMIN_ROLE_ID
        );

        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", "admin@local.test",
                "password", "Admin@123"
        ));

        assertEquals(200, response.getStatusCode().value());
        JsonNode roles = requireBody(response).path("data").path("user").path("roles");
        assertTrue(containsValue(roles, "PLATFORM_ADMIN"));
        assertTrue(containsValue(roles, "TENANT_ADMIN"));
    }

    @Test
    void loginShouldInheritPermissionsFromAllTenantRoles() {
        String marker = randomSearchMarker();
        String userId = UUID.randomUUID().toString();
        String userTenantId = UUID.randomUUID().toString();
        String email = "multi-role-" + marker + "@example.test";

        executeSql(
                "INSERT INTO users (id, email, password_hash, full_name, active) VALUES (?, ?, ?, ?, ?)",
                userId,
                email,
                DEV_PASSWORD_HASH,
                "Multi Role User " + marker,
                true
        );

        executeSql(
                "INSERT INTO user_tenants (id, tenant_id, user_id, role_id, active) VALUES (?, ?, ?, ?, ?)",
                userTenantId,
                DEFAULT_TENANT_ID,
                userId,
                VIEWER_ROLE_ID,
                true
        );

        executeSql(
                "INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at) VALUES (?, ?, ?, NOW())",
                UUID.randomUUID().toString(),
                userTenantId,
                VIEWER_ROLE_ID
        );

        executeSql(
                "INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at) VALUES (?, ?, ?, NOW())",
                UUID.randomUUID().toString(),
                userTenantId,
                TENANT_ADMIN_ROLE_ID
        );

        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", email,
                "password", "Admin@123"
        ));

        assertEquals(200, response.getStatusCode().value());
        JsonNode user = requireBody(response).path("data").path("user");

        assertTrue(containsValue(user.path("roles"), "VIEWER"));
        assertTrue(containsValue(user.path("roles"), "TENANT_ADMIN"));
        assertTrue(containsValue(user.path("permissions"), "crm.contact.read"));
        assertTrue(containsValue(user.path("permissions"), "crm.contact.delete"));
    }

    private boolean containsValue(JsonNode node, String value) {
        if (!node.isArray()) {
            return false;
        }

        for (JsonNode item : node) {
            if (value.equals(item.asText())) {
                return true;
            }
        }
        return false;
    }
}

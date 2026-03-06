package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PermissionEnforcementIntegrationTest extends AbstractIntegrationTest {

    private static final String DEFAULT_TENANT_ID = "11111111-1111-1111-1111-111111111111";
    private static final String VIEWER_ROLE_ID = "00000000-0000-0000-0000-000000000006";
    private static final String DEV_PASSWORD_HASH = "$2a$10$28RqVTDwgyR5J0XvjGFsUOhADXAU/xi/VX0fhlSoBv46MgMc3HDJi";

    @Test
    void shouldAllowReadAndBlockCreateForViewerOnContacts() {
        String marker = randomSearchMarker();
        String userId = UUID.randomUUID().toString();
        String userTenantId = UUID.randomUUID().toString();
        String email = "viewer-" + marker + "@example.test";

        executeSql(
                "INSERT INTO users (id, email, password_hash, full_name, active) VALUES (?, ?, ?, ?, ?)",
                userId,
                email,
                DEV_PASSWORD_HASH,
                "Viewer User " + marker,
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

        ResponseEntity<JsonNode> loginResponse = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", email,
                "password", "Admin@123"
        ));

        assertEquals(200, loginResponse.getStatusCode().value());
        AuthSession viewerSession = sessionFromLoginPayload(requireBody(loginResponse).path("data"));

        ResponseEntity<JsonNode> readResponse = get("/crm/contacts?page=0&size=20", viewerSession);
        assertEquals(200, readResponse.getStatusCode().value());

        ResponseEntity<JsonNode> createResponse = post("/crm/contacts", Map.of(
                "firstName", "Blocked " + marker,
                "status", "ACTIVE"
        ), viewerSession);
        assertEquals(403, createResponse.getStatusCode().value());
    }
}

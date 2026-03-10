package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CoreAuthorizationIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldRestrictTenantListToPlatformOwnerAdministrators() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-read-core",
                "tenant-read-core@example.test",
                List.of("TENANT_READ"),
                "CORE_PLATFORM"
        );

        ResponseEntity<JsonNode> response = get("/tenants?page=0&size=20", session);

        assertEquals(403, response.getStatusCode().value());

        AuthSession platformSession = loginAsDefaultAdmin();
        ResponseEntity<JsonNode> platformResponse = get("/tenants?page=0&size=20", platformSession);
        assertEquals(200, platformResponse.getStatusCode().value());
    }

    @Test
    void shouldAllowUserListAndBlockCreateWithoutUserWritePermission() {
        AuthSession session = createTenantSessionWithPermissions(
                "user-read-core",
                "user-read-core@example.test",
                List.of("USER_READ"),
                "CORE_PLATFORM"
        );

        ResponseEntity<JsonNode> listResponse = get("/users?page=0&size=20", session);
        assertEquals(200, listResponse.getStatusCode().value());

        ResponseEntity<JsonNode> createResponse = post("/users", Map.of(
                "email", "blocked-create@example.test",
                "fullName", "Blocked Create",
                "password", "Admin@123",
                "roleCode", "OPERATOR"
        ), session);

        assertEquals(403, createResponse.getStatusCode().value());
    }

    @Test
    void shouldAllowUserCreateWithUserWritePermission() {
        AuthSession session = createTenantSessionWithPermissions(
                "user-write-core",
                "user-write-core@example.test",
                List.of("USER_READ", "USER_WRITE"),
                "CORE_PLATFORM"
        );

        ResponseEntity<JsonNode> createResponse = post("/users", Map.of(
                "email", "created-user@example.test",
                "fullName", "Created User",
                "password", "Admin@123",
                "roleCode", "OPERATOR"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
    }

    @Test
    void shouldBlockPlatformAdminRoleAssignmentOutsidePlatformOwnerTenant() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-platform-admin-block",
                "tenant-platform-admin-block@example.test",
                List.of("USER_WRITE"),
                "CORE_PLATFORM"
        );

        ResponseEntity<JsonNode> createResponse = post("/users", Map.of(
                "email", "blocked-platform-admin@example.test",
                "fullName", "Blocked Platform Admin",
                "password", "Admin@123",
                "roleCode", "PLATFORM_ADMIN"
        ), session);

        assertEquals(403, createResponse.getStatusCode().value());
    }
}

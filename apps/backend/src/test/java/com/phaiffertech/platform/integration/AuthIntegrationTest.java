package com.phaiffertech.platform.integration;

import com.phaiffertech.platform.support.AbstractIntegrationTest;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthIntegrationTest extends AbstractIntegrationTest {

    private static final String DEFAULT_PASSWORD = "Admin@123";
    private static final String DEFAULT_PASSWORD_HASH = "$2a$10$28RqVTDwgyR5J0XvjGFsUOhADXAU/xi/VX0fhlSoBv46MgMc3HDJi";
    private static final String UPDATED_PASSWORD = "N3wPassword@123";

    @Test
    void loginShouldReturnAccessTokenAndRefreshCookieWithPermissions() {
        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", "admin@local.test",
                "password", DEFAULT_PASSWORD
        ));

        assertEquals(200, response.getStatusCode().value());
        JsonNode data = requireBody(response).path("data");

        assertTrue(data.path("accessToken").asText().length() > 20);
        assertTrue(data.path("refreshToken").isMissingNode() || data.path("refreshToken").asText().isBlank());
        assertTrue(data.path("user").path("permissions").isArray());
        assertTrue(data.path("user").path("permissions").toString().contains("crm.contact.read"));
        assertEquals("default", data.path("user").path("tenantCode").asText());
        assertEquals("Default Tenant", data.path("user").path("tenantName").asText());
        assertTrue(data.path("user").path("platformOwner").asBoolean());
        assertTrue(data.path("user").path("platformAdmin").asBoolean());

        String setCookie = requireSetCookieHeader(response);
        assertTrue(setCookie.startsWith("platform_refresh_token="));
        assertTrue(setCookie.contains("HttpOnly"));
        assertTrue(setCookie.contains("Path=/api/v1/auth"));
        assertTrue(setCookie.contains("SameSite=Lax"));
    }

    @Test
    void refreshShouldRotateRefreshTokenAndRejectOldOne() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> refreshResponse = postPublic("/auth/refresh", null, session.refreshCookie());

        assertEquals(200, refreshResponse.getStatusCode().value());
        String rotatedRefreshCookie = requireRefreshCookie(refreshResponse);
        assertNotEquals(session.refreshCookie(), rotatedRefreshCookie);
        assertTrue(requireBody(refreshResponse).path("data").path("refreshToken").isMissingNode());

        ResponseEntity<JsonNode> oldTokenResponse = postPublic("/auth/refresh", null, session.refreshCookie());

        assertEquals(403, oldTokenResponse.getStatusCode().value());
    }

    @Test
    void logoutShouldClearRefreshCookieAndRevokeToken() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> logoutResponse = post("/auth/logout", null, session, session.refreshCookie());

        assertEquals(200, logoutResponse.getStatusCode().value());
        String logoutCookieHeader = requireSetCookieHeader(logoutResponse);
        assertTrue(logoutCookieHeader.startsWith("platform_refresh_token="));
        assertTrue(logoutCookieHeader.contains("Max-Age=0"));

        ResponseEntity<JsonNode> refreshAfterLogout = postPublic("/auth/refresh", null, session.refreshCookie());
        assertEquals(403, refreshAfterLogout.getStatusCode().value());
        assertTrue(refreshAfterLogout.getHeaders().containsKey(HttpHeaders.SET_COOKIE));
    }

    @Test
    void meShouldReturnAuthenticatedUser() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> meResponse = get("/auth/me", session);

        assertEquals(200, meResponse.getStatusCode().value());
        JsonNode user = requireBody(meResponse).path("data");

        assertEquals(session.userId(), user.path("userId").asText());
        assertEquals("admin@local.test", user.path("email").asText());
        assertEquals("default", user.path("tenantCode").asText());
        assertEquals("SYSTEM", user.path("tenantDefaultThemeMode").asText());
    }

    @Test
    void changePasswordShouldRevokeRefreshTokensAcrossTenantSessionsAndRequireNewLogin() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "auth-change-" + suffix + "@local.test";
        String userId = UUID.randomUUID().toString();
        String firstTenantId = UUID.randomUUID().toString();
        String secondTenantId = UUID.randomUUID().toString();
        String firstTenantCode = "auth-a-" + suffix;
        String secondTenantCode = "auth-b-" + suffix;

        insertTenant(firstTenantId, firstTenantCode);
        insertTenant(secondTenantId, secondTenantCode);
        insertUser(userId, email, "Password Rotation " + suffix);
        grantRoleToTenant(firstTenantId, userId, "TENANT_ADMIN");
        grantRoleToTenant(secondTenantId, userId, "TENANT_ADMIN");

        AuthSession firstSession = sessionFromLoginResponse(login(firstTenantCode, email, DEFAULT_PASSWORD));
        AuthSession secondSession = sessionFromLoginResponse(login(secondTenantCode, email, DEFAULT_PASSWORD));

        ResponseEntity<JsonNode> changePasswordResponse = post("/auth/change-password", Map.of(
                "currentPassword", DEFAULT_PASSWORD,
                "newPassword", UPDATED_PASSWORD,
                "confirmNewPassword", UPDATED_PASSWORD
        ), firstSession, firstSession.refreshCookie());

        assertEquals(200, changePasswordResponse.getStatusCode().value());
        String clearedRefreshCookie = requireSetCookieHeader(changePasswordResponse);
        assertTrue(clearedRefreshCookie.startsWith("platform_refresh_token="));
        assertTrue(clearedRefreshCookie.contains("Max-Age=0"));

        ResponseEntity<JsonNode> firstRefreshAfterChange = postPublic("/auth/refresh", null, firstSession.refreshCookie());
        assertEquals(403, firstRefreshAfterChange.getStatusCode().value());

        ResponseEntity<JsonNode> secondRefreshAfterChange = postPublic("/auth/refresh", null, secondSession.refreshCookie());
        assertEquals(403, secondRefreshAfterChange.getStatusCode().value());

        ResponseEntity<JsonNode> oldPasswordLogin = login(firstTenantCode, email, DEFAULT_PASSWORD);
        assertEquals(403, oldPasswordLogin.getStatusCode().value());

        ResponseEntity<JsonNode> newPasswordLogin = login(secondTenantCode, email, UPDATED_PASSWORD);
        assertEquals(200, newPasswordLogin.getStatusCode().value());
    }

    @Test
    void changePasswordShouldRejectWrongCurrentPassword() {
        AuthSession session = createTenantSessionWithPermissions(
                "change-password-failure",
                "change-password-failure@local.test",
                java.util.List.of()
        );

        ResponseEntity<JsonNode> response = post("/auth/change-password", Map.of(
                "currentPassword", "WrongPassword@123",
                "newPassword", UPDATED_PASSWORD,
                "confirmNewPassword", UPDATED_PASSWORD
        ), session, session.refreshCookie());

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Current password is incorrect.", requireBody(response).path("message").asText());

        ResponseEntity<JsonNode> refreshAfterFailure = postPublic("/auth/refresh", null, session.refreshCookie());
        assertEquals(200, refreshAfterFailure.getStatusCode().value());
    }

    @Test
    void meShouldRejectTenantHeaderMismatch() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-mismatch-check",
                "tenant-mismatch-check@local.test",
                java.util.List.of()
        );

        ResponseEntity<JsonNode> response = get("/auth/me", session, UUID.randomUUID().toString());

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Tenant mismatch in request context.", requireBody(response).path("message").asText());
    }

    private ResponseEntity<JsonNode> login(String tenantCode, String email, String password) {
        return postPublic("/auth/login", Map.of(
                "tenantCode", tenantCode,
                "email", email,
                "password", password
        ));
    }

    private void insertTenant(String tenantId, String tenantCode) {
        executeSql(
                "INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, 'ACTIVE')",
                tenantId,
                "Tenant " + tenantCode,
                tenantCode
        );
    }

    private void insertUser(String userId, String email, String fullName) {
        executeSql(
                "INSERT INTO users (id, email, password_hash, full_name, active) VALUES (?, ?, ?, ?, TRUE)",
                userId,
                email,
                DEFAULT_PASSWORD_HASH,
                fullName
        );
    }

    private void grantRoleToTenant(String tenantId, String userId, String roleCode) {
        String userTenantId = UUID.randomUUID().toString();

        executeSql(
                """
                INSERT INTO user_tenants (id, tenant_id, user_id, role_id, active)
                SELECT ?, ?, ?, r.id, TRUE
                FROM roles r
                WHERE r.code = ?
                """,
                userTenantId,
                tenantId,
                userId,
                roleCode
        );

        executeSql(
                """
                INSERT INTO user_tenant_roles (id, user_tenant_id, role_id, created_at)
                SELECT ?, ?, r.id, NOW()
                FROM roles r
                WHERE r.code = ?
                """,
                UUID.randomUUID().toString(),
                userTenantId,
                roleCode
        );
    }
}

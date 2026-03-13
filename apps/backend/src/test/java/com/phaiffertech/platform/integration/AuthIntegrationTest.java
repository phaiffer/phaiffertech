package com.phaiffertech.platform.integration;

import com.phaiffertech.platform.support.AbstractIntegrationTest;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Test
    void loginShouldReturnAccessTokenAndRefreshCookieWithPermissions() {
        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", "admin@local.test",
                "password", "Admin@123"
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
}

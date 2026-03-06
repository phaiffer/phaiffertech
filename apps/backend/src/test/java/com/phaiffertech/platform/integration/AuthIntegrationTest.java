package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthIntegrationTest extends BaseIntegrationTest {

    @Test
    void loginShouldReturnAccessAndRefreshTokensWithPermissions() {
        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", "admin@local.test",
                "password", "Admin@123"
        ));

        assertEquals(200, response.getStatusCode().value());
        JsonNode data = requireBody(response).path("data");

        assertTrue(data.path("accessToken").asText().length() > 20);
        assertTrue(data.path("refreshToken").asText().length() > 20);
        assertTrue(data.path("user").path("permissions").isArray());
        assertTrue(data.path("user").path("permissions").toString().contains("crm.contact.read"));
    }

    @Test
    void refreshShouldRotateRefreshTokenAndRejectOldOne() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> refreshResponse = postPublic("/auth/refresh", Map.of(
                "refreshToken", session.refreshToken()
        ));

        assertEquals(200, refreshResponse.getStatusCode().value());
        String rotatedRefreshToken = requireBody(refreshResponse).path("data").path("refreshToken").asText();
        assertNotEquals(session.refreshToken(), rotatedRefreshToken);

        ResponseEntity<JsonNode> oldTokenResponse = postPublic("/auth/refresh", Map.of(
                "refreshToken", session.refreshToken()
        ));

        assertEquals(403, oldTokenResponse.getStatusCode().value());
    }

    @Test
    void meShouldReturnAuthenticatedUser() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> meResponse = get("/auth/me", session);

        assertEquals(200, meResponse.getStatusCode().value());
        JsonNode user = requireBody(meResponse).path("data");

        assertEquals(session.userId(), user.path("userId").asText());
        assertEquals("admin@local.test", user.path("email").asText());
    }
}

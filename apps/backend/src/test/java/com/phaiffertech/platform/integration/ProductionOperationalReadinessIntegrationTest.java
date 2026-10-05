package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@TestPropertySource(properties = {
        "app.security.jwt.refresh-cookie-secure=true",
        "app.security.jwt.refresh-cookie-same-site=Strict",
        "app.security.public-endpoints.docs-enabled=false",
        "app.security.public-endpoints.observability-enabled=false",
        "management.endpoint.health.show-details=never",
        "management.endpoint.health.show-components=never"
})
class ProductionOperationalReadinessIntegrationTest extends AbstractIntegrationTest {

    private static final String DEFAULT_PASSWORD = "Admin@123";

    @Test
    void loginShouldEmitSecureCookieAndNoStoreHeadersUnderProductionLikeProperties() {
        loginAsDefaultAdmin();

        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", "admin@local.test",
                "password", DEFAULT_PASSWORD
        ));

        assertEquals(200, response.getStatusCode().value());
        assertEquals("no-store, no-cache, must-revalidate", response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL));
        assertEquals("no-cache", response.getHeaders().getFirst(HttpHeaders.PRAGMA));

        String setCookie = requireSetCookieHeader(response);
        assertTrue(setCookie.contains("Secure"));
        assertTrue(setCookie.contains("SameSite=Strict"));
    }

    @Test
    void readinessHealthShouldStayPublicWithoutSensitiveDetails() {
        ResponseEntity<JsonNode> response = restTemplate.getForEntity("/actuator/health/readiness", JsonNode.class);

        assertEquals(200, response.getStatusCode().value());
        JsonNode body = requireBody(response);
        assertEquals("UP", body.path("status").asText());
        assertTrue(body.path("components").isMissingNode());
        assertTrue(body.path("details").isMissingNode());
    }

    @Test
    void docsAndPrometheusShouldNotBePublicWhenDisabled() {
        ResponseEntity<JsonNode> prometheusResponse = restTemplate.getForEntity("/actuator/prometheus", JsonNode.class);
        ResponseEntity<JsonNode> swaggerResponse = restTemplate.getForEntity("/swagger-ui.html", JsonNode.class);

        assertEquals(401, prometheusResponse.getStatusCode().value());
        assertEquals(401, swaggerResponse.getStatusCode().value());
    }
}

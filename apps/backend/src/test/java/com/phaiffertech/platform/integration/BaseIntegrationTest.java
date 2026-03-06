package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class BaseIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("platform_db")
            .withUsername("platform_user")
            .withPassword("platform_pass");

    @LocalServerPort
    private int port;

    @Autowired
    protected TestRestTemplate restTemplate;

    @DynamicPropertySource
    static void configureDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("app.security.jwt.secret", () -> "ZmFrZV9qd3Rfc2VjcmV0X2Zvcl9kZXZlbG9wbWVudF9vbmx5XzEyMzQ1");
    }

    protected AuthSession loginAsDefaultAdmin() {
        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", "admin@local.test",
                "password", "Admin@123"
        ));

        Assertions.assertEquals(200, response.getStatusCode().value());
        JsonNode body = requireBody(response);
        JsonNode data = body.path("data");

        return new AuthSession(
                data.path("accessToken").asText(),
                data.path("refreshToken").asText(),
                data.path("user").path("tenantId").asText(),
                data.path("user").path("userId").asText()
        );
    }

    protected ResponseEntity<JsonNode> get(String path, AuthSession session) {
        return exchange(path, HttpMethod.GET, null, session, session.tenantId());
    }

    protected ResponseEntity<JsonNode> get(String path, AuthSession session, String tenantId) {
        return exchange(path, HttpMethod.GET, null, session, tenantId);
    }

    protected ResponseEntity<JsonNode> post(String path, Object payload, AuthSession session) {
        return exchange(path, HttpMethod.POST, payload, session, session.tenantId());
    }

    protected ResponseEntity<JsonNode> put(String path, Object payload, AuthSession session) {
        return exchange(path, HttpMethod.PUT, payload, session, session.tenantId());
    }

    protected ResponseEntity<JsonNode> patch(String path, Object payload, AuthSession session) {
        return exchange(path, HttpMethod.PATCH, payload, session, session.tenantId());
    }

    protected ResponseEntity<JsonNode> delete(String path, AuthSession session) {
        return exchange(path, HttpMethod.DELETE, null, session, session.tenantId());
    }

    protected ResponseEntity<JsonNode> postPublic(String path, Object payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> request = new HttpEntity<>(payload, headers);
        return restTemplate.exchange(api(path), HttpMethod.POST, request, JsonNode.class);
    }

    protected JsonNode requireBody(ResponseEntity<JsonNode> response) {
        JsonNode body = response.getBody();
        Assertions.assertNotNull(body);
        return body;
    }

    protected String randomSearchMarker() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private ResponseEntity<JsonNode> exchange(
            String path,
            HttpMethod method,
            Object payload,
            AuthSession session,
            String tenantId
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(session.accessToken());
        headers.set("X-Tenant-Id", tenantId);

        HttpEntity<Object> request = new HttpEntity<>(payload, headers);
        return restTemplate.exchange(api(path), method, request, JsonNode.class);
    }

    private String api(String path) {
        return "http://localhost:" + port + "/api/v1" + path;
    }

    protected record AuthSession(String accessToken, String refreshToken, String tenantId, String userId) {
    }
}

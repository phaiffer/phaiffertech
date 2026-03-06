package com.phaiffertech.platform.support;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@Tag("integration")
@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class AbstractIntegrationTest extends IntegrationTestContainersConfig {

    @LocalServerPort
    private int port;

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    protected AuthSession loginAsDefaultAdmin() {
        ResponseEntity<JsonNode> response = postPublic("/auth/login", Map.of(
                "tenantCode", "default",
                "email", "admin@local.test",
                "password", "Admin@123"
        ));

        Assertions.assertEquals(200, response.getStatusCode().value());
        return sessionFromLoginPayload(requireBody(response).path("data"));
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

    protected void executeSql(String sql, Object... args) {
        jdbcTemplate.update(sql, args);
    }

    protected int countRows(String sql, Object... args) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return count == null ? 0 : count;
    }

    protected AuthSession sessionFromLoginPayload(JsonNode data) {
        return new AuthSession(
                data.path("accessToken").asText(),
                data.path("refreshToken").asText(),
                data.path("user").path("tenantId").asText(),
                data.path("user").path("userId").asText()
        );
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

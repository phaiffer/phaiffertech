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

    private static final String DEFAULT_PASSWORD_HASH = "$2a$10$28RqVTDwgyR5J0XvjGFsUOhADXAU/xi/VX0fhlSoBv46MgMc3HDJi";
    private static final String DEFAULT_PASSWORD = "Admin@123";

    @LocalServerPort
    private int port;

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    protected AuthSession loginAsDefaultAdmin() {
        ResponseEntity<JsonNode> response = login("default", "admin@local.test", DEFAULT_PASSWORD);

        Assertions.assertEquals(200, response.getStatusCode().value());
        return sessionFromLoginPayload(requireBody(response).path("data"));
    }

    protected AuthSession createTenantAdminSession(String tenantCode, String email) {
        String tenantId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();

        executeSql(
                "INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, 'ACTIVE')",
                tenantId,
                "Tenant " + tenantCode,
                tenantCode
        );
        executeSql(
                "INSERT INTO users (id, email, password_hash, full_name, active) VALUES (?, ?, ?, ?, b'1')",
                userId,
                email,
                DEFAULT_PASSWORD_HASH,
                "Tenant Admin " + tenantCode
        );
        executeSql(
                """
                INSERT INTO user_tenants (id, tenant_id, user_id, role_id, active)
                SELECT ?, ?, ?, r.id, b'1'
                FROM roles r
                WHERE r.code = 'TENANT_ADMIN'
                """,
                UUID.randomUUID().toString(),
                tenantId,
                userId
        );
        enableTenantModule(tenantId, "CORE_PLATFORM");
        enableTenantModule(tenantId, "IOT");

        ResponseEntity<JsonNode> response = login(tenantCode, email, DEFAULT_PASSWORD);
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

    private ResponseEntity<JsonNode> login(String tenantCode, String email, String password) {
        return postPublic("/auth/login", Map.of(
                "tenantCode", tenantCode,
                "email", email,
                "password", password
        ));
    }

    private void enableTenantModule(String tenantId, String moduleCode) {
        executeSql(
                """
                INSERT INTO tenant_modules (id, tenant_id, module_definition_id, enabled)
                SELECT ?, ?, m.id, b'1'
                FROM module_definitions m
                WHERE m.code = ?
                """,
                UUID.randomUUID().toString(),
                tenantId,
                moduleCode
        );
    }
}

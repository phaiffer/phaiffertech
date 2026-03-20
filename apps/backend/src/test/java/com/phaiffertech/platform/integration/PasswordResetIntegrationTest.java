package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.core.auth.service.TokenHashService;
import com.phaiffertech.platform.core.notification.dto.MailMessage;
import com.phaiffertech.platform.core.notification.service.MailDeliveryService;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class PasswordResetIntegrationTest extends AbstractIntegrationTest {

    private static final String DEFAULT_PASSWORD = "Admin@123";
    private static final String DEFAULT_PASSWORD_HASH = "$2a$10$28RqVTDwgyR5J0XvjGFsUOhADXAU/xi/VX0fhlSoBv46MgMc3HDJi";
    private static final String UPDATED_PASSWORD = "N3wPassword@123";
    private static final Pattern TOKEN_PATTERN = Pattern.compile("token=([A-Za-z0-9_-]+)");

    @Autowired
    private TokenHashService tokenHashService;

    @MockBean
    private MailDeliveryService mailDeliveryService;

    @BeforeEach
    void resetMailMock() {
        reset(mailDeliveryService);
    }

    @Test
    void requestPasswordResetShouldReturnGenericSuccessAndStoreOnlyTokenHash() {
        ProvisionedAccess access = provisionTenantAccess("password-reset-generic", "password-reset-generic@local.test");

        ResponseEntity<JsonNode> existingResponse = requestPasswordReset(access.tenantCode(), access.email());
        ResponseEntity<JsonNode> missingResponse = requestPasswordReset(access.tenantCode(), "missing-" + access.email());

        assertEquals(200, existingResponse.getStatusCode().value());
        assertEquals(200, missingResponse.getStatusCode().value());
        assertTrue(requireBody(existingResponse).path("success").asBoolean());
        assertTrue(requireBody(missingResponse).path("success").asBoolean());

        List<MailMessage> mailMessages = captureMailMessages(1);
        String rawToken = extractToken(mailMessages.getFirst().textBody());
        assertTrue(mailMessages.getFirst().textBody().contains(access.tenantCode()));

        String storedTokenHash = jdbcTemplate.queryForObject(
                "SELECT token_hash FROM password_reset_tokens WHERE tenant_id = ? AND user_id = ?",
                String.class,
                UUID.fromString(access.tenantId()),
                UUID.fromString(access.userId())
        );

        assertNotNull(storedTokenHash);
        assertNotEquals(rawToken, storedTokenHash);
        assertEquals(tokenHashService.hash(rawToken), storedTokenHash);
    }

    @Test
    void requestPasswordResetShouldInvalidateOlderPendingTokensForSameTenantUser() {
        ProvisionedAccess access = provisionTenantAccess("password-reset-rotate", "password-reset-rotate@local.test");

        requestPasswordReset(access.tenantCode(), access.email());
        requestPasswordReset(access.tenantCode(), access.email());

        List<MailMessage> mailMessages = captureMailMessages(2);
        String firstRawToken = extractToken(mailMessages.get(0).textBody());
        String secondRawToken = extractToken(mailMessages.get(1).textBody());

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT token_hash, used_at
                FROM password_reset_tokens
                WHERE tenant_id = ? AND user_id = ?
                ORDER BY created_at ASC
                """,
                UUID.fromString(access.tenantId()),
                UUID.fromString(access.userId())
        );

        assertEquals(2, rows.size());
        assertEquals(tokenHashService.hash(firstRawToken), rows.get(0).get("token_hash"));
        assertEquals(tokenHashService.hash(secondRawToken), rows.get(1).get("token_hash"));
        assertNotNull(rows.get(0).get("used_at"));
        assertNull(rows.get(1).get("used_at"));
        assertNotEquals(firstRawToken, secondRawToken);
    }

    @Test
    void confirmPasswordResetShouldUpdatePasswordAndRevokeRefreshTokensAcrossSessions() {
        String suffix = randomSearchMarker();
        String userId = UUID.randomUUID().toString();
        String email = "password-reset-confirm-" + suffix + "@local.test";
        String firstTenantId = UUID.randomUUID().toString();
        String secondTenantId = UUID.randomUUID().toString();
        String firstTenantCode = "pw-reset-a-" + suffix;
        String secondTenantCode = "pw-reset-b-" + suffix;

        createTenant(firstTenantId, firstTenantCode);
        createTenant(secondTenantId, secondTenantCode);
        insertUser(userId, email, "Password Reset " + suffix);
        grantRoleToTenant(firstTenantId, userId, "TENANT_ADMIN");
        grantRoleToTenant(secondTenantId, userId, "TENANT_ADMIN");

        AuthSession firstSession = sessionFromLoginResponse(login(firstTenantCode, email, DEFAULT_PASSWORD));
        AuthSession secondSession = sessionFromLoginResponse(login(secondTenantCode, email, DEFAULT_PASSWORD));

        ResponseEntity<JsonNode> requestResponse = requestPasswordReset(firstTenantCode, email);
        assertEquals(200, requestResponse.getStatusCode().value());

        String rawToken = extractToken(captureMailMessages(1).getFirst().textBody());

        ResponseEntity<JsonNode> confirmResponse = postPublic("/auth/confirm-password-reset", Map.of(
                "token", rawToken,
                "newPassword", UPDATED_PASSWORD,
                "confirmNewPassword", UPDATED_PASSWORD
        ), firstSession.refreshCookie());

        assertEquals(200, confirmResponse.getStatusCode().value());
        assertTrue(requireSetCookieHeader(confirmResponse).contains("Max-Age=0"));

        ResponseEntity<JsonNode> firstRefreshAfterReset = postPublic("/auth/refresh", null, firstSession.refreshCookie());
        ResponseEntity<JsonNode> secondRefreshAfterReset = postPublic("/auth/refresh", null, secondSession.refreshCookie());
        ResponseEntity<JsonNode> oldPasswordLogin = login(firstTenantCode, email, DEFAULT_PASSWORD);
        ResponseEntity<JsonNode> newPasswordLogin = login(secondTenantCode, email, UPDATED_PASSWORD);

        assertEquals(403, firstRefreshAfterReset.getStatusCode().value());
        assertEquals(403, secondRefreshAfterReset.getStatusCode().value());
        assertEquals(403, oldPasswordLogin.getStatusCode().value());
        assertEquals(200, newPasswordLogin.getStatusCode().value());
    }

    @Test
    void confirmPasswordResetShouldRejectInvalidToken() {
        ResponseEntity<JsonNode> response = postPublic("/auth/confirm-password-reset", Map.of(
                "token", "invalid-reset-token",
                "newPassword", UPDATED_PASSWORD,
                "confirmNewPassword", UPDATED_PASSWORD
        ));

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Password reset token is invalid.", requireBody(response).path("message").asText());
    }

    @Test
    void confirmPasswordResetShouldRejectExpiredToken() {
        ProvisionedAccess access = provisionTenantAccess("password-reset-expired", "password-reset-expired@local.test");

        requestPasswordReset(access.tenantCode(), access.email());
        String rawToken = extractToken(captureMailMessages(1).getFirst().textBody());

        Instant createdAt = Instant.now().minusSeconds(7200);
        executeSql(
                "UPDATE password_reset_tokens SET created_at = ?, updated_at = ?, expires_at = ? WHERE token_hash = ?",
                Timestamp.from(createdAt),
                Timestamp.from(createdAt),
                Timestamp.from(createdAt.plusSeconds(1800)),
                tokenHashService.hash(rawToken)
        );

        ResponseEntity<JsonNode> response = postPublic("/auth/confirm-password-reset", Map.of(
                "token", rawToken,
                "newPassword", UPDATED_PASSWORD,
                "confirmNewPassword", UPDATED_PASSWORD
        ));

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Password reset token expired.", requireBody(response).path("message").asText());
    }

    @Test
    void confirmPasswordResetShouldRejectUsedToken() {
        ProvisionedAccess access = provisionTenantAccess("password-reset-used", "password-reset-used@local.test");

        requestPasswordReset(access.tenantCode(), access.email());
        String rawToken = extractToken(captureMailMessages(1).getFirst().textBody());

        ResponseEntity<JsonNode> firstConfirmResponse = postPublic("/auth/confirm-password-reset", Map.of(
                "token", rawToken,
                "newPassword", UPDATED_PASSWORD,
                "confirmNewPassword", UPDATED_PASSWORD
        ));

        ResponseEntity<JsonNode> secondConfirmResponse = postPublic("/auth/confirm-password-reset", Map.of(
                "token", rawToken,
                "newPassword", "AnotherPassword@123",
                "confirmNewPassword", "AnotherPassword@123"
        ));

        assertEquals(200, firstConfirmResponse.getStatusCode().value());
        assertEquals(403, secondConfirmResponse.getStatusCode().value());
        assertEquals("Password reset token has already been used.", requireBody(secondConfirmResponse).path("message").asText());
    }

    private ResponseEntity<JsonNode> requestPasswordReset(String tenantCode, String email) {
        return postPublic("/auth/request-password-reset", Map.of(
                "tenantCode", tenantCode,
                "email", email
        ));
    }

    private ResponseEntity<JsonNode> login(String tenantCode, String email, String password) {
        return postPublic("/auth/login", Map.of(
                "tenantCode", tenantCode,
                "email", email,
                "password", password
        ));
    }

    private ProvisionedAccess provisionTenantAccess(String tenantCode, String email) {
        String suffix = randomSearchMarker();
        String tenantId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();

        createTenant(tenantId, tenantCode + "-" + suffix);
        insertUser(userId, email, "Password Reset " + suffix);
        grantRoleToTenant(tenantId, userId, "TENANT_ADMIN");

        return new ProvisionedAccess(tenantId, tenantCode + "-" + suffix, userId, email);
    }

    private void createTenant(String tenantId, String tenantCode) {
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

    private List<MailMessage> captureMailMessages(int expectedMessages) {
        ArgumentCaptor<MailMessage> mailCaptor = ArgumentCaptor.forClass(MailMessage.class);
        verify(mailDeliveryService, times(expectedMessages)).send(mailCaptor.capture());
        return mailCaptor.getAllValues();
    }

    private String extractToken(String mailBody) {
        Matcher matcher = TOKEN_PATTERN.matcher(mailBody);
        assertTrue(matcher.find(), "Expected reset token in outbound mail body.");
        return matcher.group(1);
    }

    private record ProvisionedAccess(String tenantId, String tenantCode, String userId, String email) {
    }
}

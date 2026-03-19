package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SupportImpersonationIntegrationTest extends AbstractIntegrationTest {

    @BeforeEach
    void clearImpersonationArtifacts() {
        executeSql("DELETE FROM audit_logs WHERE entity_name = 'support_impersonation_session'");
        executeSql("DELETE FROM support_impersonation_sessions");
    }

    @Test
    void platformAdminCanStartAndStopImpersonationAndAuditActionsRemainTagged() {
        AuthSession platformAdmin = loginAsDefaultAdmin();
        AuthSession targetTenantAdmin = createTenantAdminSession("support-target", "support-target@local.test", "CORE_PLATFORM", "CRM");

        ResponseEntity<JsonNode> startResponse = post("/auth/impersonation/start", Map.of(
                "targetTenantId", targetTenantAdmin.tenantId(),
                "reason", "Investigate CRM contact synchronization issue",
                "durationMinutes", 20
        ), platformAdmin);

        assertEquals(200, startResponse.getStatusCode().value());
        JsonNode startedUser = requireBody(startResponse).path("data").path("user");
        assertEquals(targetTenantAdmin.tenantId(), startedUser.path("tenantId").asText());
        assertTrue(startedUser.path("impersonation").isObject());
        assertEquals(platformAdmin.tenantId(), startedUser.path("impersonation").path("sourceTenantId").asText());
        assertEquals("support-target", startedUser.path("tenantCode").asText());
        assertTrue(startedUser.path("platformAdmin").isBoolean());
        assertTrue(!startedUser.path("platformAdmin").asBoolean());

        AuthSession impersonatedSession = authSession(
                requireBody(startResponse).path("data").path("accessToken").asText(),
                platformAdmin.refreshCookie(),
                startedUser.path("tenantId").asText(),
                startedUser.path("userId").asText()
        );

        String marker = randomSearchMarker();
        ResponseEntity<JsonNode> createContactResponse = post("/crm/contacts", Map.of(
                "firstName", "Support " + marker,
                "lastName", "Review",
                "email", "support." + marker + "@example.test",
                "phone", "+5511999999999",
                "company", "Tenant Support",
                "status", "ACTIVE"
        ), impersonatedSession);

        assertEquals(200, createContactResponse.getStatusCode().value());
        assertEquals(targetTenantAdmin.tenantId(), countSingleValue(
                "SELECT tenant_id::text FROM audit_logs WHERE entity_name = 'crm_contact' ORDER BY created_at DESC LIMIT 1"
        ));

        String supportSessionId = startedUser.path("impersonation").path("sessionId").asText();
        assertEquals(1, countRows(
                """
                SELECT COUNT(*)
                FROM audit_logs
                WHERE tenant_id = ?
                  AND entity_name = 'crm_contact'
                  AND (payload::jsonb -> 'supportImpersonation' ->> 'sessionId')::uuid = ?
                """,
                targetTenantAdmin.tenantId(),
                supportSessionId
        ));

        ResponseEntity<JsonNode> stopResponse = post("/auth/impersonation/stop", null, impersonatedSession);

        assertEquals(200, stopResponse.getStatusCode().value());
        JsonNode stoppedUser = requireBody(stopResponse).path("data").path("user");
        assertEquals(platformAdmin.tenantId(), stoppedUser.path("tenantId").asText());
        assertTrue(stoppedUser.path("impersonation").isMissingNode() || stoppedUser.path("impersonation").isNull());
        assertNotEquals(impersonatedSession.accessToken(), requireBody(stopResponse).path("data").path("accessToken").asText());

        assertEquals(1, countRows(
                """
                SELECT COUNT(*)
                FROM audit_logs
                WHERE tenant_id = ?
                  AND entity_name = 'support_impersonation_session'
                  AND action = 'START'
                  AND entity_id::uuid = ?
                """,
                targetTenantAdmin.tenantId(),
                supportSessionId
        ));
        assertEquals(1, countRows(
                """
                SELECT COUNT(*)
                FROM audit_logs
                WHERE tenant_id = ?
                  AND entity_name = 'support_impersonation_session'
                  AND action = 'STOP'
                  AND entity_id::uuid = ?
                """,
                targetTenantAdmin.tenantId(),
                supportSessionId
        ));

        assertEquals("ENDED", countSingleValue(
                "SELECT status FROM support_impersonation_sessions WHERE id = ?",
                supportSessionId
        ));
        assertEquals(1, countRows(
                """
                SELECT COUNT(*)
                FROM support_impersonation_sessions
                WHERE id = ?
                  AND ended_at IS NOT NULL
                """,
                supportSessionId
        ));
    }

    @Test
    void normalTenantUsersCannotStartImpersonation() {
        AuthSession tenantAdmin = createTenantAdminSession("support-blocked", "support-blocked@local.test");
        AuthSession targetTenantAdmin = createTenantAdminSession("support-other", "support-other@local.test");

        ResponseEntity<JsonNode> response = post("/auth/impersonation/start", Map.of(
                "targetTenantId", targetTenantAdmin.tenantId(),
                "reason", "Attempt unauthorized support access",
                "durationMinutes", 10
        ), tenantAdmin);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("Platform administration is restricted to platform owner administrators.", requireBody(response).path("message").asText());
        assertEquals(0, countRows("SELECT COUNT(*) FROM support_impersonation_sessions"));
    }

    @Test
    void impersonatedSessionsRemainBoundToTheTargetTenant() {
        AuthSession platformAdmin = loginAsDefaultAdmin();
        AuthSession targetTenantAdmin = createTenantAdminSession("support-scope", "support-scope@local.test", "CORE_PLATFORM", "CRM");

        ResponseEntity<JsonNode> startResponse = post("/auth/impersonation/start", Map.of(
                "targetTenantId", targetTenantAdmin.tenantId(),
                "reason", "Validate tenant isolation under support access",
                "durationMinutes", 10
        ), platformAdmin);

        AuthSession impersonatedSession = authSession(
                requireBody(startResponse).path("data").path("accessToken").asText(),
                platformAdmin.refreshCookie(),
                requireBody(startResponse).path("data").path("user").path("tenantId").asText(),
                requireBody(startResponse).path("data").path("user").path("userId").asText()
        );

        ResponseEntity<JsonNode> mismatchedResponse = get(
                "/crm/contacts?page=0&size=20",
                impersonatedSession,
                UUID.randomUUID().toString()
        );

        assertEquals(403, mismatchedResponse.getStatusCode().value());
        assertEquals("Tenant mismatch in request context.", requireBody(mismatchedResponse).path("message").asText());
    }

    private String countSingleValue(String sql, Object... args) {
        return jdbcTemplate.queryForObject(sql, String.class, coerceArgs(args));
    }

    private Object[] coerceArgs(Object... args) {
        return Arrays.stream(args)
                .map(this::coerceArg)
                .toArray();
    }

    private Object coerceArg(Object arg) {
        if (!(arg instanceof String text)) {
            return arg;
        }
        try {
            return UUID.fromString(text);
        } catch (IllegalArgumentException ignored) {
            return text;
        }
    }
}

package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MultiTenantUserAssignmentIsolationIntegrationTest extends AbstractIntegrationTest {

    @Test
    void crmCompanyShouldRejectOwnerUserFromAnotherTenant() {
        AuthSession session = loginAsDefaultAdmin();
        String marker = randomSearchMarker();
        String foreignUserId = seedForeignTenantUser(marker);

        ResponseEntity<JsonNode> response = post("/crm/companies", Map.of(
                "name", "Isolation Co " + marker,
                "status", "ACTIVE",
                "ownerUserId", foreignUserId
        ), session);

        assertEquals(404, response.getStatusCode().value());
    }

    private String seedForeignTenantUser(String marker) {
        String tenantId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();

        executeSql(
                "INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, 'ACTIVE')",
                tenantId,
                "Foreign Tenant " + marker,
                "foreign-" + marker
        );
        executeSql(
                "INSERT INTO users (id, email, password_hash, full_name, active) VALUES (?, ?, ?, ?, TRUE)",
                userId,
                "foreign." + marker + "@example.test",
                "$2a$10$28RqVTDwgyR5J0XvjGFsUOhADXAU/xi/VX0fhlSoBv46MgMc3HDJi",
                "Foreign User " + marker
        );
        executeSql(
                """
                INSERT INTO user_tenants (id, tenant_id, user_id, role_id, active)
                SELECT ?, ?, ?, r.id, TRUE
                FROM roles r
                WHERE r.code = 'TENANT_ADMIN'
                """,
                UUID.randomUUID().toString(),
                tenantId,
                userId
        );

        return userId;
    }
}

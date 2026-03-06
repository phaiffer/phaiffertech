package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MultiTenantIsolationIntegrationTest extends BaseIntegrationTest {

    @Test
    void shouldBlockAccessWhenTenantHeaderDoesNotMatchAuthenticatedTenant() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> response = get(
                "/crm/contacts?page=0&size=20",
                session,
                UUID.randomUUID().toString()
        );

        assertEquals(403, response.getStatusCode().value());
    }
}

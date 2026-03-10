package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TenantManagementIntegrationTest extends AbstractIntegrationTest {

    @Test
    void platformAdminShouldCreateAndUpdateTenantBrandingAndContracts() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> createResponse = post("/tenants", Map.of(
                "name", "Clinic North",
                "code", "clinic-north",
                "logoUrl", "/branding/clinic-north.png",
                "primaryColor", "#1e3a8a",
                "accentColor", "#0ea5e9",
                "defaultThemeMode", "DARK",
                "allowUserThemeOverride", false,
                "contractedModules", List.of("CRM", "PET")
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        JsonNode created = requireBody(createResponse).path("data");
        assertEquals("clinic-north", created.path("code").asText());
        assertEquals("/branding/clinic-north.png", created.path("logoUrl").asText());
        assertEquals("#1e3a8a", created.path("primaryColor").asText());
        assertEquals("#0ea5e9", created.path("accentColor").asText());
        assertEquals("DARK", created.path("defaultThemeMode").asText());
        assertTrue(containsValue(created.path("contractedModules"), "CORE_PLATFORM"));
        assertTrue(containsValue(created.path("contractedModules"), "CRM"));
        assertTrue(containsValue(created.path("contractedModules"), "PET"));

        String tenantId = created.path("id").asText();
        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, Map.of(
                "name", "Clinic North Updated",
                "code", "clinic-north",
                "logoUrl", "",
                "primaryColor", "#1e40af",
                "accentColor", "#06b6d4",
                "defaultThemeMode", "LIGHT",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("IOT")
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertEquals("Clinic North Updated", updated.path("name").asText());
        assertEquals("LIGHT", updated.path("defaultThemeMode").asText());
        assertTrue(containsValue(updated.path("contractedModules"), "CORE_PLATFORM"));
        assertTrue(containsValue(updated.path("contractedModules"), "IOT"));
    }

    private boolean containsValue(JsonNode arrayNode, String expected) {
        for (JsonNode item : arrayNode) {
            if (expected.equals(item.asText())) {
                return true;
            }
        }
        return false;
    }
}

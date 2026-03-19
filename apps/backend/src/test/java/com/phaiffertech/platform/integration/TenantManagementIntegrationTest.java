package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TenantManagementIntegrationTest extends AbstractIntegrationTest {

    @Test
    void platformAdminShouldApplyPlanDefaultsAndPreserveManualOverrides() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> createResponse = post("/tenants", Map.of(
                "name", "Clinic North",
                "code", "clinic-north",
                "planCode", "BASIC",
                "logoUrl", "/branding/clinic-north.png",
                "primaryColor", "#1e3a8a",
                "accentColor", "#0ea5e9",
                "defaultThemeMode", "DARK",
                "allowUserThemeOverride", false,
                "contractedModules", List.of("CRM", "PET"),
                "featureEntitlements", List.of("beta.dashboard", "usage.billing.preview")
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        JsonNode created = requireBody(createResponse).path("data");
        assertEquals("clinic-north", created.path("code").asText());
        assertEquals("BASIC", created.path("planCode").asText());
        assertEquals("/branding/clinic-north.png", created.path("logoUrl").asText());
        assertEquals("#1e3a8a", created.path("primaryColor").asText());
        assertEquals("#0ea5e9", created.path("accentColor").asText());
        assertEquals("DARK", created.path("defaultThemeMode").asText());
        assertTrue(containsValue(created.path("contractedModules"), "CORE_PLATFORM"));
        assertTrue(containsValue(created.path("contractedModules"), "CRM"));
        assertTrue(containsValue(created.path("contractedModules"), "PET"));
        assertEquals(1, created.path("moduleOverrides").size());
        assertTrue(containsValue(created.path("moduleOverrides"), "PET"));
        assertTrue(containsValue(created.path("featureEntitlements"), "beta.dashboard"));
        assertTrue(containsValue(created.path("featureEntitlements"), "usage.billing.preview"));
        assertTrue(containsValue(created.path("effectiveFeatureEntitlements"), "crm.basic"));
        assertTrue(containsValue(created.path("effectiveFeatureEntitlements"), "beta.dashboard"));

        String tenantId = created.path("id").asText();
        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, Map.of(
                "name", "Clinic North Updated",
                "code", "clinic-north",
                "planCode", "PRO",
                "logoUrl", "",
                "primaryColor", "#1e40af",
                "accentColor", "#06b6d4",
                "defaultThemeMode", "LIGHT",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("CRM", "PET", "IOT"),
                "featureEntitlements", List.of("usage.billing.preview")
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertEquals("Clinic North Updated", updated.path("name").asText());
        assertEquals("PRO", updated.path("planCode").asText());
        assertEquals("LIGHT", updated.path("defaultThemeMode").asText());
        assertTrue(containsValue(updated.path("contractedModules"), "CORE_PLATFORM"));
        assertTrue(containsValue(updated.path("contractedModules"), "CRM"));
        assertTrue(containsValue(updated.path("contractedModules"), "PET"));
        assertTrue(containsValue(updated.path("contractedModules"), "IOT"));
        assertTrue(containsValue(updated.path("moduleOverrides"), "PET"));
        assertEquals(1, updated.path("featureEntitlements").size());
        assertTrue(containsValue(updated.path("featureEntitlements"), "usage.billing.preview"));
        assertTrue(containsValue(updated.path("effectiveFeatureEntitlements"), "crm.full"));
        assertTrue(containsValue(updated.path("effectiveFeatureEntitlements"), "pet.full"));
        assertTrue(containsValue(updated.path("effectiveFeatureEntitlements"), "iot.basic"));

        ResponseEntity<JsonNode> downgradeResponse = put("/tenants/" + tenantId, Map.of(
                "name", "Clinic North Updated",
                "code", "clinic-north",
                "planCode", "BASIC",
                "logoUrl", "",
                "primaryColor", "#1e40af",
                "accentColor", "#06b6d4",
                "defaultThemeMode", "LIGHT",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("CRM", "PET"),
                "featureEntitlements", List.of("usage.billing.preview")
        ), session);

        assertEquals(200, downgradeResponse.getStatusCode().value());
        JsonNode downgraded = requireBody(downgradeResponse).path("data");
        assertEquals("BASIC", downgraded.path("planCode").asText());
        assertTrue(containsValue(downgraded.path("contractedModules"), "CRM"));
        assertTrue(containsValue(downgraded.path("contractedModules"), "PET"));
        assertFalse(containsValue(downgraded.path("contractedModules"), "IOT"));
        assertTrue(containsValue(downgraded.path("moduleOverrides"), "PET"));
        assertTrue(containsValue(downgraded.path("effectiveFeatureEntitlements"), "crm.basic"));
        assertFalse(containsValue(downgraded.path("effectiveFeatureEntitlements"), "iot.basic"));
    }

    @Test
    void platformAdminShouldRestrictModuleAccessOnDowngradeWithoutDeletingRows() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> createResponse = post("/tenants", Map.of(
                "name", "Clinic West",
                "code", "clinic-west",
                "planCode", "PRO",
                "defaultThemeMode", "SYSTEM",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("CRM", "PET", "IOT"),
                "featureEntitlements", List.of()
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String tenantId = requireBody(createResponse).path("data").path("id").asText();
        assertEquals(4, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ?", tenantId));

        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, Map.of(
                "name", "Clinic West",
                "code", "clinic-west",
                "planCode", "BASIC",
                "defaultThemeMode", "SYSTEM",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("CRM"),
                "featureEntitlements", List.of()
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertTrue(containsValue(updated.path("contractedModules"), "CORE_PLATFORM"));
        assertTrue(containsValue(updated.path("contractedModules"), "CRM"));
        assertFalse(containsValue(updated.path("contractedModules"), "PET"));
        assertFalse(containsValue(updated.path("contractedModules"), "IOT"));

        assertEquals(4, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ?", tenantId));
        assertEquals(2, countRows(
                """
                SELECT COUNT(*)
                FROM tenant_modules tm
                WHERE tm.tenant_id = ?
                  AND tm.enabled = TRUE
                  AND tm.deleted_at IS NULL
                """,
                tenantId
        ));
        assertEquals(2, countRows(
                """
                SELECT COUNT(*)
                FROM tenant_modules tm
                WHERE tm.tenant_id = ?
                  AND tm.enabled = FALSE
                """,
                tenantId
        ));
    }

    @Test
    void platformAdminShouldReuseSoftDeletedTenantModuleRowsWhenReenablingContracts() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> createResponse = post("/tenants", Map.of(
                "name", "Clinic South",
                "code", "clinic-south",
                "planCode", "BASIC",
                "defaultThemeMode", "SYSTEM",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("CRM"),
                "featureEntitlements", List.of("beta.dashboard")
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        JsonNode created = requireBody(createResponse).path("data");
        String tenantId = created.path("id").asText();

        assertEquals(2, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ?", tenantId));

        executeSql(
                """
                UPDATE tenant_modules
                SET enabled = FALSE,
                    deleted_at = CURRENT_TIMESTAMP
                WHERE tenant_id = ?
                  AND module_definition_id = (
                      SELECT id
                      FROM module_definitions
                      WHERE code = 'CRM'
                  )
                """,
                tenantId
        );

        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, Map.of(
                "name", "Clinic South",
                "code", "clinic-south",
                "planCode", "BASIC",
                "defaultThemeMode", "SYSTEM",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("CRM"),
                "featureEntitlements", List.of("beta.dashboard")
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertTrue(containsValue(updated.path("contractedModules"), "CRM"));

        assertEquals(2, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ?", tenantId));
        assertEquals(1, countRows(
                """
                SELECT COUNT(*)
                FROM tenant_modules tm
                JOIN module_definitions md ON md.id = tm.module_definition_id
                WHERE tm.tenant_id = ?
                  AND md.code = 'CRM'
                  AND tm.deleted_at IS NULL
                  AND tm.enabled = TRUE
                """,
                tenantId
        ));
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

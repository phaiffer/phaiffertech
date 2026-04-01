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
                "planCode", "PETSHOP",
                "logoUrl", "/branding/clinic-north.png",
                "primaryColor", "#1e3a8a",
                "accentColor", "#0ea5e9",
                "defaultThemeMode", "DARK",
                "allowUserThemeOverride", false,
                "contractedModules", List.of("PET", "CRM"),
                "featureEntitlements", List.of("beta.dashboard", "usage.billing.preview")
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        JsonNode created = requireBody(createResponse).path("data");
        assertEquals("clinic-north", created.path("code").asText());
        assertEquals("PETSHOP", created.path("planCode").asText());
        assertEquals("/branding/clinic-north.png", created.path("logoUrl").asText());
        assertEquals("#1e3a8a", created.path("primaryColor").asText());
        assertEquals("#0ea5e9", created.path("accentColor").asText());
        assertEquals("DARK", created.path("defaultThemeMode").asText());
        assertTrue(containsValue(created.path("contractedModules"), "CORE_PLATFORM"));
        assertTrue(containsValue(created.path("contractedModules"), "PET"));
        assertTrue(containsValue(created.path("contractedModules"), "CRM"));
        assertEquals(1, created.path("moduleOverrides").size());
        assertTrue(containsValue(created.path("moduleOverrides"), "CRM"));
        assertTrue(containsValue(created.path("featureEntitlements"), "beta.dashboard"));
        assertTrue(containsValue(created.path("featureEntitlements"), "usage.billing.preview"));
        assertTrue(containsValue(created.path("effectiveFeatureEntitlements"), "pet.retail"));
        assertTrue(containsValue(created.path("effectiveFeatureEntitlements"), "beta.dashboard"));

        String tenantId = created.path("id").asText();
        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, Map.of(
                "name", "Clinic North Updated",
                "code", "clinic-north",
                "planCode", "BANHO_TOSA_CLINICA",
                "logoUrl", "",
                "primaryColor", "#1e40af",
                "accentColor", "#06b6d4",
                "defaultThemeMode", "LIGHT",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("PET", "CRM"),
                "featureEntitlements", List.of("usage.billing.preview")
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertEquals("Clinic North Updated", updated.path("name").asText());
        assertEquals("BANHO_TOSA_CLINICA", updated.path("planCode").asText());
        assertEquals("LIGHT", updated.path("defaultThemeMode").asText());
        assertTrue(containsValue(updated.path("contractedModules"), "CORE_PLATFORM"));
        assertTrue(containsValue(updated.path("contractedModules"), "PET"));
        assertTrue(containsValue(updated.path("contractedModules"), "CRM"));
        assertTrue(containsValue(updated.path("moduleOverrides"), "CRM"));
        assertEquals(1, updated.path("featureEntitlements").size());
        assertTrue(containsValue(updated.path("featureEntitlements"), "usage.billing.preview"));
        assertTrue(containsValue(updated.path("effectiveFeatureEntitlements"), "pet.aesthetics"));
        assertTrue(containsValue(updated.path("effectiveFeatureEntitlements"), "pet.clinic"));
        assertTrue(containsValue(updated.path("effectiveFeatureEntitlements"), "pet.veterinary"));
        assertTrue(containsValue(updated.path("effectiveFeatureEntitlements"), "pet.retail"));

        ResponseEntity<JsonNode> downgradeResponse = put("/tenants/" + tenantId, Map.of(
                "name", "Clinic North Updated",
                "code", "clinic-north",
                "planCode", "PETSHOP",
                "logoUrl", "",
                "primaryColor", "#1e40af",
                "accentColor", "#06b6d4",
                "defaultThemeMode", "LIGHT",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("PET", "CRM"),
                "featureEntitlements", List.of("usage.billing.preview")
        ), session);

        assertEquals(200, downgradeResponse.getStatusCode().value());
        JsonNode downgraded = requireBody(downgradeResponse).path("data");
        assertEquals("PETSHOP", downgraded.path("planCode").asText());
        assertTrue(containsValue(downgraded.path("contractedModules"), "PET"));
        assertTrue(containsValue(downgraded.path("contractedModules"), "CRM"));
        assertTrue(containsValue(downgraded.path("moduleOverrides"), "CRM"));
        assertTrue(containsValue(downgraded.path("effectiveFeatureEntitlements"), "pet.retail"));
        assertFalse(containsValue(downgraded.path("effectiveFeatureEntitlements"), "pet.aesthetics"));
        assertFalse(containsValue(downgraded.path("effectiveFeatureEntitlements"), "pet.clinic"));
        assertFalse(containsValue(downgraded.path("effectiveFeatureEntitlements"), "pet.veterinary"));
    }

    @Test
    void platformAdminShouldRestrictModuleAccessOnDowngradeWithoutDeletingRows() {
        AuthSession session = loginAsDefaultAdmin();

        ResponseEntity<JsonNode> createResponse = post("/tenants", Map.of(
                "name", "Clinic West",
                "code", "clinic-west",
                "planCode", "BANHO_TOSA_CLINICA",
                "defaultThemeMode", "SYSTEM",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("PET", "CRM", "IOT"),
                "featureEntitlements", List.of()
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String tenantId = requireBody(createResponse).path("data").path("id").asText();
        assertEquals(4, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ?", tenantId));

        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, Map.of(
                "name", "Clinic West",
                "code", "clinic-west",
                "planCode", "PETSHOP",
                "defaultThemeMode", "SYSTEM",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("PET"),
                "featureEntitlements", List.of()
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertTrue(containsValue(updated.path("contractedModules"), "CORE_PLATFORM"));
        assertTrue(containsValue(updated.path("contractedModules"), "PET"));
        assertFalse(containsValue(updated.path("contractedModules"), "CRM"));
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
                "planCode", "PETSHOP",
                "defaultThemeMode", "SYSTEM",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("PET", "CRM"),
                "featureEntitlements", List.of("beta.dashboard")
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        JsonNode created = requireBody(createResponse).path("data");
        String tenantId = created.path("id").asText();

        assertEquals(3, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ?", tenantId));

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
                "planCode", "PETSHOP",
                "defaultThemeMode", "SYSTEM",
                "allowUserThemeOverride", true,
                "contractedModules", List.of("PET", "CRM"),
                "featureEntitlements", List.of("beta.dashboard")
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertTrue(containsValue(updated.path("contractedModules"), "CRM"));

        assertEquals(3, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ?", tenantId));
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

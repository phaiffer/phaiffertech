package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TenantManagementIntegrationTest extends AbstractIntegrationTest {

    @Test
    void platformAdminShouldApplyPlanDefaultsAndPreserveManualOverrides() {
        AuthSession session = loginAsDefaultAdmin();
        String initialAdminEmail = "clinic-north-admin@local.test";
        String temporaryPassword = "TempClinicNorth@123";

        ResponseEntity<JsonNode> createResponse = post("/tenants", tenantCreatePayload(
                "Clinic North",
                "clinic-north",
                "PETSHOP",
                "/branding/clinic-north.png",
                "#1e3a8a",
                "#0ea5e9",
                "DARK",
                false,
                List.of("PET", "CRM"),
                List.of("beta.dashboard", "usage.billing.preview"),
                "Morgan Clinic",
                initialAdminEmail,
                temporaryPassword,
                true,
                "2026-06-30"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        JsonNode created = requireBody(createResponse).path("data");
        assertEquals("clinic-north", created.path("code").asText());
        assertEquals("PETSHOP", created.path("planCode").asText());
        assertEquals("/branding/clinic-north.png", created.path("logoUrl").asText());
        assertEquals("#1e3a8a", created.path("primaryColor").asText());
        assertEquals("#0ea5e9", created.path("accentColor").asText());
        assertEquals("DARK", created.path("defaultThemeMode").asText());
        assertEquals("2026-06-30", created.path("trialEndDate").asText());
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
        assertEquals(1, countRows("SELECT COUNT(*) FROM users WHERE email = ?", initialAdminEmail));
        assertEquals(1, countRows(
                """
                SELECT COUNT(*)
                FROM user_tenants ut
                JOIN users u ON u.id = ut.user_id
                JOIN roles r ON r.id = ut.role_id
                WHERE ut.tenant_id = ?
                  AND u.email = ?
                  AND ut.active = TRUE
                  AND r.code = 'TENANT_ADMIN'
                """,
                tenantId,
                initialAdminEmail
        ));
        assertEquals(1, countRows(
                """
                SELECT COUNT(*)
                FROM user_tenant_roles utr
                JOIN user_tenants ut ON ut.id = utr.user_tenant_id
                JOIN users u ON u.id = ut.user_id
                JOIN roles r ON r.id = utr.role_id
                WHERE ut.tenant_id = ?
                  AND u.email = ?
                  AND r.code = 'TENANT_ADMIN'
                """,
                tenantId,
                initialAdminEmail
        ));
        assertEquals(1, countRows(
                "SELECT COUNT(*) FROM users WHERE email = ? AND require_password_change_on_first_access = TRUE",
                initialAdminEmail
        ));
        String storedPasswordHash = jdbcTemplate.queryForObject(
                "SELECT password_hash FROM users WHERE email = ?",
                String.class,
                initialAdminEmail
        );
        assertNotEquals(temporaryPassword, storedPasswordHash);
        assertTrue(storedPasswordHash != null && storedPasswordHash.startsWith("$2"));

        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, tenantUpdatePayload(
                "Clinic North Updated",
                "clinic-north",
                "BANHO_TOSA_CLINICA",
                "",
                "#1e40af",
                "#06b6d4",
                "LIGHT",
                true,
                List.of("PET", "CRM"),
                List.of("usage.billing.preview"),
                "2026-07-31"
        ), session);

        assertEquals(200, updateResponse.getStatusCode().value());
        JsonNode updated = requireBody(updateResponse).path("data");
        assertEquals("Clinic North Updated", updated.path("name").asText());
        assertEquals("BANHO_TOSA_CLINICA", updated.path("planCode").asText());
        assertEquals("LIGHT", updated.path("defaultThemeMode").asText());
        assertEquals("2026-07-31", updated.path("trialEndDate").asText());
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

        ResponseEntity<JsonNode> downgradeResponse = put("/tenants/" + tenantId, tenantUpdatePayload(
                "Clinic North Updated",
                "clinic-north",
                "PETSHOP",
                "",
                "#1e40af",
                "#06b6d4",
                "LIGHT",
                true,
                List.of("PET", "CRM"),
                List.of("usage.billing.preview"),
                "2026-07-31"
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

        ResponseEntity<JsonNode> createResponse = post("/tenants", tenantCreatePayload(
                "Clinic West",
                "clinic-west",
                "BANHO_TOSA_CLINICA",
                null,
                null,
                null,
                "SYSTEM",
                true,
                List.of("PET", "CRM", "IOT"),
                List.of(),
                "West Operator",
                "clinic-west-admin@local.test",
                "TempClinicWest@123",
                true,
                "2026-05-31"
        ), session);

        assertEquals(200, createResponse.getStatusCode().value());
        String tenantId = requireBody(createResponse).path("data").path("id").asText();
        assertEquals(4, countRows("SELECT COUNT(*) FROM tenant_modules WHERE tenant_id = ?", tenantId));

        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, tenantUpdatePayload(
                "Clinic West",
                "clinic-west",
                "PETSHOP",
                null,
                null,
                null,
                "SYSTEM",
                true,
                List.of("PET"),
                List.of(),
                "2026-05-31"
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

        ResponseEntity<JsonNode> createResponse = post("/tenants", tenantCreatePayload(
                "Clinic South",
                "clinic-south",
                "PETSHOP",
                null,
                null,
                null,
                "SYSTEM",
                true,
                List.of("PET", "CRM"),
                List.of("beta.dashboard"),
                "South Operator",
                "clinic-south-admin@local.test",
                "TempClinicSouth@123",
                true,
                "2026-08-15"
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

        ResponseEntity<JsonNode> updateResponse = put("/tenants/" + tenantId, tenantUpdatePayload(
                "Clinic South",
                "clinic-south",
                "PETSHOP",
                null,
                null,
                null,
                "SYSTEM",
                true,
                List.of("PET", "CRM"),
                List.of("beta.dashboard"),
                "2026-08-15"
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

    private Map<String, Object> tenantCreatePayload(
            String name,
            String code,
            String planCode,
            String logoUrl,
            String primaryColor,
            String accentColor,
            String defaultThemeMode,
            boolean allowUserThemeOverride,
            List<String> contractedModules,
            List<String> featureEntitlements,
            String initialAdminFullName,
            String initialAdminEmail,
            String temporaryPassword,
            boolean requirePasswordChangeOnFirstAccess,
            String trialEndDate
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", name);
        payload.put("code", code);
        payload.put("planCode", planCode);
        payload.put("defaultThemeMode", defaultThemeMode);
        payload.put("allowUserThemeOverride", allowUserThemeOverride);
        payload.put("contractedModules", contractedModules);
        payload.put("featureEntitlements", featureEntitlements);
        payload.put("initialAdminFullName", initialAdminFullName);
        payload.put("initialAdminEmail", initialAdminEmail);
        payload.put("temporaryPassword", temporaryPassword);
        payload.put("requirePasswordChangeOnFirstAccess", requirePasswordChangeOnFirstAccess);
        payload.put("trialEndDate", trialEndDate);
        if (logoUrl != null) {
            payload.put("logoUrl", logoUrl);
        }
        if (primaryColor != null) {
            payload.put("primaryColor", primaryColor);
        }
        if (accentColor != null) {
            payload.put("accentColor", accentColor);
        }
        return payload;
    }

    private Map<String, Object> tenantUpdatePayload(
            String name,
            String code,
            String planCode,
            String logoUrl,
            String primaryColor,
            String accentColor,
            String defaultThemeMode,
            boolean allowUserThemeOverride,
            List<String> contractedModules,
            List<String> featureEntitlements,
            String trialEndDate
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", name);
        payload.put("code", code);
        payload.put("planCode", planCode);
        payload.put("defaultThemeMode", defaultThemeMode);
        payload.put("allowUserThemeOverride", allowUserThemeOverride);
        payload.put("contractedModules", contractedModules);
        payload.put("featureEntitlements", featureEntitlements);
        payload.put("trialEndDate", trialEndDate);
        if (logoUrl != null) {
            payload.put("logoUrl", logoUrl);
        }
        if (primaryColor != null) {
            payload.put("primaryColor", primaryColor);
        }
        if (accentColor != null) {
            payload.put("accentColor", accentColor);
        }
        return payload;
    }
}

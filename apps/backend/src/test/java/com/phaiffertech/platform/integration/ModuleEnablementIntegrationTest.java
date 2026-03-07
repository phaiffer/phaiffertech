package com.phaiffertech.platform.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.phaiffertech.platform.support.AbstractIntegrationTest;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ModuleEnablementIntegrationTest extends AbstractIntegrationTest {

    @Test
    void shouldBlockPetEndpointsWhenTenantModuleIsNotEnabled() {
        AuthSession session = createTenantAdminSession(
                "tenant-no-pet",
                "tenant-no-pet@example.test",
                "CORE_PLATFORM"
        );

        ResponseEntity<JsonNode> response = get("/pet/clients?page=0&size=20", session);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("MODULE_DISABLED", requireBody(response).path("code").asText());
    }

    @Test
    void shouldBlockIotEndpointsWhenFeatureFlagDisablesTheModule() {
        AuthSession session = createTenantAdminSession(
                "tenant-iot-flag-off",
                "tenant-iot-flag-off@example.test",
                "CORE_PLATFORM",
                "IOT"
        );

        upsertTenantFeatureFlag(session.tenantId(), "iot.enabled", false);

        ResponseEntity<JsonNode> response = get("/iot/dashboard/summary", session);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("MODULE_DISABLED", requireBody(response).path("code").asText());
    }

    @Test
    void shouldExposeSeparatedModuleStatusAndAggregateDashboardThroughCapabilities() {
        AuthSession session = createTenantAdminSession(
                "tenant-capabilities",
                "tenant-capabilities@example.test",
                "CORE_PLATFORM",
                "CRM",
                "PET"
        );

        upsertTenantFeatureFlag(session.tenantId(), "pet.enabled", false);

        ResponseEntity<JsonNode> registryResponse = get("/modules", session);
        assertEquals(200, registryResponse.getStatusCode().value());

        JsonNode modules = requireBody(registryResponse).path("data");
        JsonNode crm = findModule(modules, "CRM");
        JsonNode pet = findModule(modules, "PET");
        JsonNode iot = findModule(modules, "IOT");

        assertNotNull(crm);
        assertNotNull(pet);
        assertNotNull(iot);

        assertTrue(crm.path("moduleEnabled").asBoolean());
        assertTrue(crm.path("featureFlagEnabled").asBoolean());
        assertTrue(crm.path("available").asBoolean());
        assertTrue(crm.path("enabled").asBoolean());

        assertTrue(pet.path("moduleEnabled").asBoolean());
        assertFalse(pet.path("featureFlagEnabled").asBoolean());
        assertFalse(pet.path("available").asBoolean());
        assertFalse(pet.path("enabled").asBoolean());

        assertFalse(iot.path("moduleEnabled").asBoolean());
        assertTrue(iot.path("featureFlagEnabled").asBoolean());
        assertFalse(iot.path("available").asBoolean());

        ResponseEntity<JsonNode> dashboardResponse = get("/dashboard/summary", session);
        assertEquals(200, dashboardResponse.getStatusCode().value());

        JsonNode summaries = requireBody(dashboardResponse).path("data").path("modules");
        Set<String> moduleCodes = new HashSet<>();
        summaries.forEach(summary -> moduleCodes.add(summary.path("moduleCode").asText()));

        assertEquals(1, summaries.size());
        assertTrue(moduleCodes.contains("CRM"));
        assertFalse(moduleCodes.contains("PET"));
        assertFalse(moduleCodes.contains("IOT"));
        assertTrue(requireBody(dashboardResponse).path("data").path("coreSummary").path("cards").size() > 0);
        assertTrue(summaries.get(0).path("summaryCards").size() > 0);
    }

    @Test
    void shouldHideModuleSectionsFromGlobalDashboardWhenUserLacksDashboardPermission() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-no-dashboard-permission",
                "tenant-no-dashboard-permission@example.test",
                List.of(),
                "CRM",
                "IOT",
                "PET"
        );

        ResponseEntity<JsonNode> response = get("/dashboard/summary", session);
        assertEquals(200, response.getStatusCode().value());

        JsonNode data = requireBody(response).path("data");
        assertTrue(data.path("coreSummary").path("cards").size() > 0);
        assertEquals(0, data.path("modules").size());
    }

    @Test
    void shouldBlockPetDashboardWhenPermissionIsMissingEvenIfModuleIsEnabled() {
        AuthSession session = createTenantSessionWithPermissions(
                "tenant-pet-dashboard-blocked",
                "tenant-pet-dashboard-blocked@example.test",
                List.of("pet.client.read"),
                "PET"
        );

        ResponseEntity<JsonNode> response = get("/pet/dashboard/summary", session);

        assertEquals(403, response.getStatusCode().value());
        assertEquals("FORBIDDEN", requireBody(response).path("code").asText());
    }

    private JsonNode findModule(JsonNode modules, String code) {
        for (JsonNode module : modules) {
            if (code.equals(module.path("code").asText())) {
                return module;
            }
        }
        return null;
    }
}

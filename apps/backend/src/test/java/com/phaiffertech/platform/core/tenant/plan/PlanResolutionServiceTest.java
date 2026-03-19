package com.phaiffertech.platform.core.tenant.plan;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlanResolutionServiceTest {

    private final PlanResolutionService planResolutionService = new PlanResolutionService();

    @Test
    void shouldResolveKnownPlanDefinitions() {
        PlanDefinition basic = planResolutionService.resolve("basic");
        PlanDefinition pro = planResolutionService.resolve("PRO");

        assertEquals(PlanDefinition.BASIC, basic);
        assertIterableEquals(java.util.List.of("CRM"), basic.getDefaultModules());
        assertIterableEquals(java.util.List.of("crm.basic"), basic.getDefaultEntitlements());

        assertEquals(PlanDefinition.PRO, pro);
        assertIterableEquals(java.util.List.of("CRM", "PET", "IOT"), pro.getDefaultModules());
        assertIterableEquals(java.util.List.of("crm.full", "pet.full", "iot.basic"), pro.getDefaultEntitlements());
    }

    @Test
    void shouldNormalizeBlankPlanCodesUsingFallbackOrDefault() {
        assertEquals("PRO", planResolutionService.normalizePlanCode(" ", "pro"));
        assertEquals("STANDARD", planResolutionService.normalizePlanCode(null, null));
    }

    @Test
    void shouldRejectUnknownPlanCodes() {
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> planResolutionService.resolve("custom")
        );

        assertEquals("Unknown plan code: CUSTOM", error.getMessage());
    }
}

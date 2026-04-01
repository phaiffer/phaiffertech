package com.phaiffertech.platform.core.tenant.plan;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlanResolutionServiceTest {

    private final PlanResolutionService planResolutionService = new PlanResolutionService();

    @Test
    void shouldResolveKnownPackageDefinitions() {
        PlanDefinition petshop = planResolutionService.resolve("petshop");
        PlanDefinition banhoTosaClinica = planResolutionService.resolve("BANHO_TOSA_CLINICA");

        assertEquals(PlanDefinition.PETSHOP, petshop);
        assertIterableEquals(java.util.List.of("PET"), petshop.getDefaultModules());
        assertIterableEquals(java.util.List.of("pet.retail"), petshop.getDefaultEntitlements());

        assertEquals(PlanDefinition.BANHO_TOSA_CLINICA, banhoTosaClinica);
        assertIterableEquals(java.util.List.of("PET"), banhoTosaClinica.getDefaultModules());
        assertIterableEquals(
                java.util.List.of("pet.aesthetics", "pet.clinic", "pet.veterinary", "pet.retail"),
                banhoTosaClinica.getDefaultEntitlements()
        );
    }

    @Test
    void shouldNormalizeBlankPlanCodesUsingFallbackOrDefault() {
        assertEquals("BANHO_TOSA_CLINICA", planResolutionService.normalizePlanCode(" ", "banho_tosa_clinica"));
        assertEquals("PETSHOP", planResolutionService.normalizePlanCode(null, null));
    }

    @Test
    void shouldResolveSupportedProductPackagesAndRejectOutOfScopePackages() {
        ProductPackageDefinition productPackage = planResolutionService.resolveProductPackage("clinica_veterinaria");

        assertEquals(ProductPackageDefinition.CLINICA_VETERINARIA, productPackage);
        assertIterableEquals(
                java.util.List.of(
                        ProductPackageDefinition.PETSHOP,
                        ProductPackageDefinition.BANHO_TOSA,
                        ProductPackageDefinition.CLINICA_VETERINARIA,
                        ProductPackageDefinition.PETSHOP_BANHO_TOSA,
                        ProductPackageDefinition.BANHO_TOSA_CLINICA
                ),
                planResolutionService.supportedProductPackages()
        );

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> planResolutionService.resolveProductPackage("PETSHOP_CLINICA")
        );

        assertEquals("Unknown product package: PETSHOP_CLINICA", error.getMessage());
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

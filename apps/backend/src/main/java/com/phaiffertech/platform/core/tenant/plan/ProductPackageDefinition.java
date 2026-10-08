package com.phaiffertech.platform.core.tenant.plan;

import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import java.util.List;

public enum ProductPackageDefinition {
    PETSHOP(
            "PETSHOP",
            List.of("PET"),
            List.of(TenantEntitlementKeys.PET_RETAIL)
    ),
    BANHO_TOSA(
            "BANHO_TOSA",
            List.of("PET"),
            List.of(TenantEntitlementKeys.PET_AESTHETICS)
    ),
    CLINICA_VETERINARIA(
            "CLINICA_VETERINARIA",
            List.of("PET"),
            List.of(
                    TenantEntitlementKeys.PET_CLINIC,
                    TenantEntitlementKeys.PET_VETERINARY,
                    TenantEntitlementKeys.PET_RETAIL
            )
    ),
    PETSHOP_BANHO_TOSA(
            "PETSHOP_BANHO_TOSA",
            List.of("PET"),
            List.of(
                    TenantEntitlementKeys.PET_AESTHETICS,
                    TenantEntitlementKeys.PET_RETAIL
            )
    ),
    BANHO_TOSA_CLINICA(
            "BANHO_TOSA_CLINICA",
            List.of("PET"),
            List.of(
                    TenantEntitlementKeys.PET_AESTHETICS,
                    TenantEntitlementKeys.PET_CLINIC,
                    TenantEntitlementKeys.PET_VETERINARY,
                    TenantEntitlementKeys.PET_RETAIL
            )
    );

    private final String code;
    private final List<String> defaultModules;
    private final List<String> defaultEntitlements;

    ProductPackageDefinition(String code, List<String> defaultModules, List<String> defaultEntitlements) {
        this.code = code;
        this.defaultModules = List.copyOf(defaultModules);
        this.defaultEntitlements = List.copyOf(defaultEntitlements);
    }

    public String getCode() {
        return code;
    }

    public List<String> getDefaultModules() {
        return defaultModules;
    }

    public List<String> getDefaultEntitlements() {
        return defaultEntitlements;
    }
}

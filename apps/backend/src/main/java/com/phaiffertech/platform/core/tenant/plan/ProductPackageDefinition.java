package com.phaiffertech.platform.core.tenant.plan;

import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import java.util.List;

public enum ProductPackageDefinition {
    PET_ONLY(
            "PET_ONLY",
            List.of("PET"),
            TenantEntitlementKeys.PET_SUBMODULES
    ),
    VET_PLUS(
            "VET_PLUS",
            List.of("PET"),
            List.of(
                    TenantEntitlementKeys.PET_CLINIC,
                    TenantEntitlementKeys.PET_VETERINARY
            )
    ),
    IOT_MONITOR(
            "IOT_MONITOR",
            List.of("IOT"),
            List.of(TenantEntitlementKeys.IOT_BASIC)
    ),
    ENTERPRISE_FULL(
            "ENTERPRISE_FULL",
            List.of("CRM", "PET", "IOT"),
            List.of(TenantEntitlementKeys.ANY)
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

package com.phaiffertech.platform.core.tenant.plan;

import java.util.List;

public enum PlanDefinition {
    BASIC(
            "BASIC",
            List.of("CRM"),
            List.of("crm.basic")
    ),
    STANDARD(
            "STANDARD",
            List.of("CRM", "PET"),
            List.of("crm.full", "pet.basic")
    ),
    PRO(
            "PRO",
            List.of("CRM", "PET", "IOT"),
            List.of("crm.full", "pet.full", "iot.basic")
    ),
    ENTERPRISE(
            "ENTERPRISE",
            List.of("CRM", "PET", "IOT"),
            List.of("*")
    );

    private final String code;
    private final List<String> defaultModules;
    private final List<String> defaultEntitlements;

    PlanDefinition(String code, List<String> defaultModules, List<String> defaultEntitlements) {
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

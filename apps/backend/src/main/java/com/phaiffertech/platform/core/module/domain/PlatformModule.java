package com.phaiffertech.platform.core.module.domain;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum PlatformModule {
    CRM("CRM", "/api/v1/crm", "crm.enabled"),
    PET("PET", "/api/v1/pet", "pet.enabled"),
    IOT("IOT", "/api/v1/iot", "iot.enabled");

    private final String code;
    private final String apiPathPrefix;
    private final String featureFlagKey;

    PlatformModule(String code, String apiPathPrefix, String featureFlagKey) {
        this.code = code;
        this.apiPathPrefix = apiPathPrefix;
        this.featureFlagKey = featureFlagKey;
    }

    public String getCode() {
        return code;
    }

    public String getApiPathPrefix() {
        return apiPathPrefix;
    }

    public String getFeatureFlagKey() {
        return featureFlagKey;
    }

    public static Optional<PlatformModule> fromRequestPath(String requestPath) {
        return Arrays.stream(values())
                .filter(module -> requestPath.startsWith(module.apiPathPrefix))
                .findFirst();
    }

    public static Optional<PlatformModule> fromCode(String code) {
        String normalized = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(module -> module.code.equals(normalized))
                .findFirst();
    }
}

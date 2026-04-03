package com.phaiffertech.platform.core.module.domain;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum PlatformModule {
    CRM("CRM", "/api/v1/crm", "crm.enabled", false),
    PET("PET", "/api/v1/pet", "pet.enabled", true);

    private final String code;
    private final String apiPathPrefix;
    private final String featureFlagKey;
    private final boolean visibleProductSurface;

    PlatformModule(String code, String apiPathPrefix, String featureFlagKey, boolean visibleProductSurface) {
        this.code = code;
        this.apiPathPrefix = apiPathPrefix;
        this.featureFlagKey = featureFlagKey;
        this.visibleProductSurface = visibleProductSurface;
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

    public boolean isVisibleProductSurface() {
        return visibleProductSurface;
    }

    public static boolean isVisibleWorkspaceModuleCode(String code) {
        String normalized = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        if ("CORE_PLATFORM".equals(normalized)) {
            return true;
        }

        return fromCode(normalized)
                .map(PlatformModule::isVisibleProductSurface)
                .orElse(false);
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

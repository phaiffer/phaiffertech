package com.phaiffertech.platform.shared.crud;

import java.util.Locale;

public final class BaseSearchSpecificationBuilder {

    private BaseSearchSpecificationBuilder() {
    }

    public static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String normalizeUpper(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toUpperCase();
    }

    public static String containsPattern(String value) {
        String normalized = normalize(value);
        return normalized == null ? "%" : "%" + normalized.toLowerCase(Locale.ROOT) + "%";
    }
}

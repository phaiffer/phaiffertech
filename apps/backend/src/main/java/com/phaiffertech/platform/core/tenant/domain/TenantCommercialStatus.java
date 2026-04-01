package com.phaiffertech.platform.core.tenant.domain;

import java.util.Locale;

public enum TenantCommercialStatus {
    TRIAL,
    ACTIVE,
    SUSPENDED,
    CANCELLED;

    public static TenantCommercialStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Tenant status must be one of: TRIAL, ACTIVE, SUSPENDED, CANCELLED.");
        }

        try {
            return TenantCommercialStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Tenant status must be one of: TRIAL, ACTIVE, SUSPENDED, CANCELLED.",
                    ex
            );
        }
    }
}

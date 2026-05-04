package com.phaiffertech.platform.modules.pet.billing.dto;

public record PetBillingMessageSettingsResponse(
        String pixKey,
        String billingDisplayName,
        String planRenewalMessageTemplate,
        String petReadyMessageTemplate,
        boolean pixConfigured
) {
}

package com.phaiffertech.platform.modules.pet.billing.dto;

import jakarta.validation.constraints.Size;

public record PetBillingMessageSettingsRequest(
        @Size(max = 180) String pixKey,
        @Size(max = 150) String billingDisplayName,
        @Size(max = 2000) String planRenewalMessageTemplate,
        @Size(max = 2000) String petReadyMessageTemplate
) {
}

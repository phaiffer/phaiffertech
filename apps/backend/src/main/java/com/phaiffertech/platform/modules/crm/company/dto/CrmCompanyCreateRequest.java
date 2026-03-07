package com.phaiffertech.platform.modules.crm.company.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CrmCompanyCreateRequest(
        @NotBlank String name,
        String legalName,
        String document,
        @Email String email,
        String phone,
        String website,
        String industry,
        String status,
        UUID ownerUserId
) {
}

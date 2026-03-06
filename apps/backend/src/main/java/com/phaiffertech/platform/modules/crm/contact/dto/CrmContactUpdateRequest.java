package com.phaiffertech.platform.modules.crm.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CrmContactUpdateRequest(
        @NotBlank String firstName,
        String lastName,
        @Email String email,
        String phone,
        String company,
        @NotBlank String status,
        UUID ownerUserId
) {
}

package com.phaiffertech.platform.modules.crm.contact.dto;

import jakarta.validation.constraints.NotBlank;

public record CrmContactCreateRequest(
        @NotBlank String firstName,
        String lastName,
        String email,
        String phone
) {
}

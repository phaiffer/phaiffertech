package com.phaiffertech.platform.modules.crm.lead.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CrmLeadUpdateRequest(
        @NotBlank String name,
        @Email String email,
        String phone,
        String source,
        @NotBlank String status,
        UUID assignedUserId
) {
}

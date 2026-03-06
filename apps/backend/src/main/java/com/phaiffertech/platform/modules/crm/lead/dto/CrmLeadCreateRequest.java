package com.phaiffertech.platform.modules.crm.lead.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CrmLeadCreateRequest(
        @NotBlank String name,
        @Email String email,
        String phone,
        String source,
        String status,
        UUID assignedUserId
) {
}

package com.phaiffertech.platform.modules.crm.contact.dto;

import java.time.Instant;
import java.util.UUID;

public record CrmContactResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String phone,
        UUID companyId,
        String company,
        String status,
        UUID ownerUserId,
        Instant createdAt,
        Instant updatedAt
) {
}

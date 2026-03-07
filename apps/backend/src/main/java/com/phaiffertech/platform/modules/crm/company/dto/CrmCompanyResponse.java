package com.phaiffertech.platform.modules.crm.company.dto;

import java.time.Instant;
import java.util.UUID;

public record CrmCompanyResponse(
        UUID id,
        String name,
        String legalName,
        String document,
        String email,
        String phone,
        String website,
        String industry,
        String status,
        UUID ownerUserId,
        Instant createdAt,
        Instant updatedAt
) {
}

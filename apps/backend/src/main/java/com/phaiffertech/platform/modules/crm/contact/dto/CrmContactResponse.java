package com.phaiffertech.platform.modules.crm.contact.dto;

import java.util.UUID;

public record CrmContactResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String status
) {
}

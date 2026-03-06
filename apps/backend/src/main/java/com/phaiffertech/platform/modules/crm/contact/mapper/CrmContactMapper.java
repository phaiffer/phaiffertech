package com.phaiffertech.platform.modules.crm.contact.mapper;

import com.phaiffertech.platform.modules.crm.contact.domain.CrmContact;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactResponse;

public final class CrmContactMapper {

    private CrmContactMapper() {
    }

    public static CrmContactResponse toResponse(CrmContact contact) {
        return new CrmContactResponse(
                contact.getId(),
                contact.getFirstName(),
                contact.getLastName(),
                contact.getEmail(),
                contact.getPhone(),
                contact.getStatus()
        );
    }
}

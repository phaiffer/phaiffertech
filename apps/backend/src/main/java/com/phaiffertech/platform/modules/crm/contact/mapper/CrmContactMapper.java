package com.phaiffertech.platform.modules.crm.contact.mapper;

import com.phaiffertech.platform.modules.crm.contact.domain.CrmContact;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactCreateRequest;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactResponse;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class CrmContactMapper implements BaseCrudMapper<
        CrmContact,
        CrmContactCreateRequest,
        CrmContactUpdateRequest,
        CrmContactResponse> {

    public static final CrmContactMapper INSTANCE = new CrmContactMapper();

    private CrmContactMapper() {
    }

    @Override
    public CrmContact toNewEntity(CrmContactCreateRequest request) {
        CrmContact contact = new CrmContact();
        contact.setFirstName(request.firstName().trim());
        contact.setLastName(request.lastName());
        contact.setEmail(request.email());
        contact.setPhone(request.phone());
        contact.setCompany(request.company());
        contact.setStatus(resolveStatus(request.status()));
        contact.setOwnerUserId(request.ownerUserId());
        return contact;
    }

    @Override
    public void updateEntity(CrmContact entity, CrmContactUpdateRequest request) {
        entity.setFirstName(request.firstName().trim());
        entity.setLastName(request.lastName());
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        entity.setCompany(request.company());
        entity.setStatus(resolveStatus(request.status()));
        entity.setOwnerUserId(request.ownerUserId());
    }

    @Override
    public CrmContactResponse toResponse(CrmContact contact) {
        return new CrmContactResponse(
                contact.getId(),
                contact.getFirstName(),
                contact.getLastName(),
                contact.getEmail(),
                contact.getPhone(),
                contact.getCompany(),
                contact.getStatus(),
                contact.getOwnerUserId(),
                contact.getCreatedAt(),
                contact.getUpdatedAt()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return status.trim().toUpperCase();
    }
}

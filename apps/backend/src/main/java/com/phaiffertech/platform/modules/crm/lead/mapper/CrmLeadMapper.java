package com.phaiffertech.platform.modules.crm.lead.mapper;

import com.phaiffertech.platform.modules.crm.lead.domain.CrmLead;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadCreateRequest;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadResponse;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class CrmLeadMapper implements BaseCrudMapper<
        CrmLead,
        CrmLeadCreateRequest,
        CrmLeadUpdateRequest,
        CrmLeadResponse> {

    public static final CrmLeadMapper INSTANCE = new CrmLeadMapper();

    private CrmLeadMapper() {
    }

    @Override
    public CrmLead toNewEntity(CrmLeadCreateRequest request) {
        CrmLead lead = new CrmLead();
        lead.setName(request.name().trim());
        lead.setEmail(request.email());
        lead.setPhone(request.phone());
        lead.setSource(resolveSource(request.source()));
        lead.setStatus(resolveStatus(request.status()));
        lead.setAssignedUserId(request.assignedUserId());
        lead.setCompanyId(request.companyId());
        lead.setContactId(request.contactId());
        lead.setNotes(normalize(request.notes()));
        return lead;
    }

    @Override
    public void updateEntity(CrmLead entity, CrmLeadUpdateRequest request) {
        entity.setName(request.name().trim());
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        entity.setSource(resolveSource(request.source()));
        entity.setStatus(resolveStatus(request.status()));
        entity.setAssignedUserId(request.assignedUserId());
        entity.setCompanyId(request.companyId());
        entity.setContactId(request.contactId());
        entity.setNotes(normalize(request.notes()));
    }

    @Override
    public CrmLeadResponse toResponse(CrmLead lead) {
        return new CrmLeadResponse(
                lead.getId(),
                lead.getName(),
                lead.getEmail(),
                lead.getPhone(),
                lead.getSource(),
                lead.getStatus(),
                lead.getAssignedUserId(),
                lead.getCompanyId(),
                lead.getContactId(),
                lead.getNotes(),
                lead.getCreatedAt(),
                lead.getUpdatedAt()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "NEW";
        }
        return status.trim().toUpperCase();
    }

    private String resolveSource(String source) {
        String normalized = normalize(source);
        return normalized == null ? null : normalized.toUpperCase();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

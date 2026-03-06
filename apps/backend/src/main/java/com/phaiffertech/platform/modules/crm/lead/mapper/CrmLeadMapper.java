package com.phaiffertech.platform.modules.crm.lead.mapper;

import com.phaiffertech.platform.modules.crm.lead.domain.CrmLead;
import com.phaiffertech.platform.modules.crm.lead.dto.CrmLeadResponse;

public final class CrmLeadMapper {

    private CrmLeadMapper() {
    }

    public static CrmLeadResponse toResponse(CrmLead lead) {
        return new CrmLeadResponse(
                lead.getId(),
                lead.getName(),
                lead.getEmail(),
                lead.getPhone(),
                lead.getSource(),
                lead.getStatus(),
                lead.getAssignedUserId(),
                lead.getCreatedAt(),
                lead.getUpdatedAt()
        );
    }
}

package com.phaiffertech.platform.modules.crm.deal.mapper;

import com.phaiffertech.platform.modules.crm.deal.domain.CrmDeal;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealResponse;

public final class CrmDealMapper {

    private CrmDealMapper() {
    }

    public static CrmDealResponse toResponse(CrmDeal deal) {
        return new CrmDealResponse(
                deal.getId(),
                deal.getTitle(),
                deal.getDescription(),
                deal.getAmount(),
                deal.getCurrency(),
                deal.getStatus(),
                deal.getCompanyId(),
                deal.getPipelineStageId(),
                deal.getContactId(),
                deal.getLeadId(),
                deal.getOwnerUserId(),
                deal.getExpectedCloseDate(),
                deal.getCreatedAt(),
                deal.getUpdatedAt()
        );
    }
}

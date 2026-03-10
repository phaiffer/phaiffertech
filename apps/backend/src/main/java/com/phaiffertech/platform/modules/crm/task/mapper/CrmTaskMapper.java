package com.phaiffertech.platform.modules.crm.task.mapper;

import com.phaiffertech.platform.modules.crm.shared.service.CrmRelationResolverService;
import com.phaiffertech.platform.modules.crm.task.domain.CrmTask;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskResponse;

public final class CrmTaskMapper {

    private CrmTaskMapper() {
    }

    public static CrmTaskResponse toResponse(CrmTask task) {
        var relation = CrmRelationResolverService.fromStored(
                task.getRelatedType(),
                task.getRelatedId(),
                task.getCompanyId(),
                task.getContactId(),
                task.getLeadId(),
                task.getDealId()
        );
        return new CrmTaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.getStatus(),
                task.getPriority(),
                task.getAssignedUserId(),
                task.getCompanyId(),
                task.getContactId(),
                task.getLeadId(),
                task.getDealId(),
                relation.relatedType(),
                relation.relatedReferenceType(),
                relation.relatedModule(),
                relation.relatedEntityType(),
                relation.relatedId(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}

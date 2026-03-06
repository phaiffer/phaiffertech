package com.phaiffertech.platform.modules.crm.task.mapper;

import com.phaiffertech.platform.modules.crm.task.domain.CrmTask;
import com.phaiffertech.platform.modules.crm.task.dto.CrmTaskResponse;

public final class CrmTaskMapper {

    private CrmTaskMapper() {
    }

    public static CrmTaskResponse toResponse(CrmTask task) {
        return new CrmTaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.getStatus(),
                task.getAssignedUserId(),
                task.getRelatedType(),
                task.getRelatedId(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}

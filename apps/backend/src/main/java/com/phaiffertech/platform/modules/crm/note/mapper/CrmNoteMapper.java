package com.phaiffertech.platform.modules.crm.note.mapper;

import com.phaiffertech.platform.modules.crm.shared.service.CrmRelationResolverService;
import com.phaiffertech.platform.modules.crm.note.domain.CrmNote;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteResponse;

public final class CrmNoteMapper {

    private CrmNoteMapper() {
    }

    public static CrmNoteResponse toResponse(CrmNote note) {
        var relation = CrmRelationResolverService.fromStored(
                note.getRelatedType(),
                note.getRelatedId(),
                note.getCompanyId(),
                note.getContactId(),
                note.getLeadId(),
                note.getDealId()
        );
        return new CrmNoteResponse(
                note.getId(),
                note.getContent(),
                note.getCompanyId(),
                note.getContactId(),
                note.getLeadId(),
                note.getDealId(),
                relation.relatedType(),
                relation.relatedReferenceType(),
                relation.relatedModule(),
                relation.relatedEntityType(),
                relation.relatedId(),
                note.getAuthorUserId(),
                note.getCreatedBy(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}

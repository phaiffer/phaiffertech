package com.phaiffertech.platform.modules.crm.note.mapper;

import com.phaiffertech.platform.modules.crm.note.domain.CrmNote;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteResponse;

public final class CrmNoteMapper {

    private CrmNoteMapper() {
    }

    public static CrmNoteResponse toResponse(CrmNote note) {
        return new CrmNoteResponse(
                note.getId(),
                note.getContent(),
                note.getCompanyId(),
                note.getContactId(),
                note.getLeadId(),
                note.getDealId(),
                note.getRelatedType(),
                note.getRelatedId(),
                note.getAuthorUserId(),
                note.getCreatedBy(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}

package com.phaiffertech.platform.modules.crm.note.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CrmNoteUpdateRequest(
        @NotBlank String content,
        UUID companyId,
        UUID contactId,
        UUID leadId,
        UUID dealId,
        String relatedType,
        UUID relatedId
) {
}

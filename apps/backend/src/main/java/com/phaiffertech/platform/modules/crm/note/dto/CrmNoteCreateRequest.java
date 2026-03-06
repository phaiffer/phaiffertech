package com.phaiffertech.platform.modules.crm.note.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CrmNoteCreateRequest(
        @NotBlank String content,
        @NotBlank String relatedType,
        @NotNull UUID relatedId,
        UUID authorUserId
) {
}

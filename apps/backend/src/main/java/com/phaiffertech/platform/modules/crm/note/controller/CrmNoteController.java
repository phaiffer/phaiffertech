package com.phaiffertech.platform.modules.crm.note.controller;

import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteCreateRequest;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteResponse;
import com.phaiffertech.platform.modules.crm.note.service.CrmNoteService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/notes")
public class CrmNoteController {

    private final CrmNoteService service;

    public CrmNoteController(CrmNoteService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR','VIEWER')")
    public ApiResponse<PageResponseDto<CrmNoteResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String relatedType,
            @RequestParam(required = false) UUID relatedId
    ) {
        return ApiResponse.success(service.list(pageRequest, relatedType, relatedId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<CrmNoteResponse> create(@Valid @RequestBody CrmNoteCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }
}

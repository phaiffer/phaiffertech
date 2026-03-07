package com.phaiffertech.platform.modules.crm.note.controller;

import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteCreateRequest;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteResponse;
import com.phaiffertech.platform.modules.crm.note.dto.CrmNoteUpdateRequest;
import com.phaiffertech.platform.modules.crm.note.service.CrmNoteService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
    @RequirePermission("crm.note.read")
    public ApiResponse<PageResponseDto<CrmNoteResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID contactId,
            @RequestParam(required = false) UUID leadId,
            @RequestParam(required = false) UUID dealId
    ) {
        return ApiResponse.success(service.list(pageRequest, companyId, contactId, leadId, dealId));
    }

    @GetMapping("/{id}")
    @RequirePermission("crm.note.read")
    public ApiResponse<CrmNoteResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("crm.note.create")
    public ApiResponse<CrmNoteResponse> create(@Valid @RequestBody CrmNoteCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("crm.note.update")
    public ApiResponse<CrmNoteResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmNoteUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("crm.note.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}

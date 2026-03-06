package com.phaiffertech.platform.modules.crm.contact.controller;

import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactCreateRequest;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactResponse;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactUpdateRequest;
import com.phaiffertech.platform.modules.crm.contact.service.CrmContactService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/contacts")
public class CrmContactController {

    private final CrmContactService service;

    public CrmContactController(CrmContactService service) {
        this.service = service;
    }

    @PostMapping
    @RequirePermission("crm.contact.create")
    public ApiResponse<CrmContactResponse> create(@Valid @RequestBody CrmContactCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @GetMapping
    @RequirePermission("crm.contact.read")
    public ApiResponse<PageResponseDto<CrmContactResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID ownerUserId
    ) {
        return ApiResponse.success(service.list(pageRequest, status, ownerUserId));
    }

    @GetMapping("/{id}")
    @RequirePermission("crm.contact.read")
    public ApiResponse<CrmContactResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PutMapping("/{id}")
    @RequirePermission("crm.contact.update")
    public ApiResponse<CrmContactResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmContactUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("crm.contact.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/restore")
    @RequirePermission("crm.contact.delete")
    public ApiResponse<CrmContactResponse> restore(@PathVariable UUID id) {
        return ApiResponse.success(service.restore(id));
    }
}

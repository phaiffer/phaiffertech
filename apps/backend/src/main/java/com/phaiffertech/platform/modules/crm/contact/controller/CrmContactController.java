package com.phaiffertech.platform.modules.crm.contact.controller;

import com.phaiffertech.platform.modules.crm.contact.service.CrmContactService;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactCreateRequest;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactResponse;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    public ApiResponse<PageResponseDto<CrmContactResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }
}

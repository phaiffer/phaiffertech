package com.phaiffertech.platform.modules.crm.contact.controller;

import com.phaiffertech.platform.modules.crm.contact.service.CrmContactService;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactCreateRequest;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactResponse;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.response.PageResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/contacts")
public class CrmContactController {

    private final CrmContactService service;

    public CrmContactController(CrmContactService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<CrmContactResponse> create(@Valid @RequestBody CrmContactCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR','VIEWER')")
    public ApiResponse<PageResponse<CrmContactResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(service.list(page, size));
    }
}

package com.phaiffertech.platform.core.tenant.controller;

import com.phaiffertech.platform.core.tenant.service.TenantService;
import com.phaiffertech.platform.core.tenant.dto.TenantCreateRequest;
import com.phaiffertech.platform.core.tenant.dto.TenantResponse;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<TenantResponse> create(@Valid @RequestBody TenantCreateRequest request) {
        return ApiResponse.success(tenantService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<PageResponseDto<TenantResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(tenantService.list(pageRequest));
    }
}

package com.phaiffertech.platform.modules.crm.deal.controller;

import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealCreateRequest;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealResponse;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealUpdateRequest;
import com.phaiffertech.platform.modules.crm.deal.service.CrmDealService;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/deals")
public class CrmDealController {

    private final CrmDealService service;

    public CrmDealController(CrmDealService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR','VIEWER')")
    public ApiResponse<PageResponseDto<CrmDealResponse>> list(@Valid @ModelAttribute PageRequestDto pageRequest) {
        return ApiResponse.success(service.list(pageRequest));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<CrmDealResponse> create(@Valid @RequestBody CrmDealCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN','TENANT_OWNER','TENANT_ADMIN','MANAGER','OPERATOR')")
    public ApiResponse<CrmDealResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmDealUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }
}

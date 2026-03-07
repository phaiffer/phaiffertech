package com.phaiffertech.platform.modules.crm.deal.controller;

import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealCreateRequest;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealResponse;
import com.phaiffertech.platform.modules.crm.deal.dto.CrmDealUpdateRequest;
import com.phaiffertech.platform.modules.crm.deal.service.CrmDealService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm/deals")
public class CrmDealController {

    private final CrmDealService service;

    public CrmDealController(CrmDealService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("crm.deal.read")
    public ApiResponse<PageResponseDto<CrmDealResponse>> list(
            @Valid @ModelAttribute PageRequestDto pageRequest,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String status,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UUID companyId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UUID pipelineStageId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UUID ownerUserId
    ) {
        return ApiResponse.success(service.list(pageRequest, status, companyId, pipelineStageId, ownerUserId));
    }

    @GetMapping("/{id}")
    @RequirePermission("crm.deal.read")
    public ApiResponse<CrmDealResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(service.getById(id));
    }

    @PostMapping
    @RequirePermission("crm.deal.create")
    public ApiResponse<CrmDealResponse> create(@Valid @RequestBody CrmDealCreateRequest request) {
        return ApiResponse.success(service.create(request));
    }

    @PutMapping("/{id}")
    @RequirePermission("crm.deal.update")
    public ApiResponse<CrmDealResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CrmDealUpdateRequest request
    ) {
        return ApiResponse.success(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("crm.deal.delete")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
